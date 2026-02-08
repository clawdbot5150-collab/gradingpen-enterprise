import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../middleware/error-handler';
import { requireSubscription, userRateLimit } from '../middleware/auth';
import { createSubscriptionBasedLimiter } from '../middleware/rate-limiter';
import { QueueManager } from '../config/queues';
import { loggerHelpers } from '../utils/logger';
import { canCreateVideo, calculateVideoCost, VideoResolution } from '@aivideobuddy/shared';

const router = express.Router();

// Rate limiting for AI operations
const aiGenerationLimiter = createSubscriptionBasedLimiter(10, 50, 200, 500, 60 * 60 * 1000); // Per hour

// Validation rules
const textToVideoValidation = [
  body('prompt').isLength({ min: 10, max: 1000 }).trim().withMessage('Prompt must be 10-1000 characters'),
  body('duration').isInt({ min: 1, max: 300 }).withMessage('Duration must be 1-300 seconds'),
  body('aspectRatio').isIn(['16:9', '9:16', '1:1', '4:3']).withMessage('Invalid aspect ratio'),
  body('model').isIn(['openai', 'runway', 'stable-video']).withMessage('Invalid model'),
  body('style').optional().isLength({ max: 100 }).withMessage('Style must not exceed 100 characters'),
  body('seed').optional().isInt({ min: 0, max: 2147483647 }).withMessage('Invalid seed value'),
  body('guidanceScale').optional().isFloat({ min: 1, max: 20 }).withMessage('Guidance scale must be 1-20'),
];

const imageToVideoValidation = [
  body('imageUrl').isURL().withMessage('Valid image URL is required'),
  body('prompt').optional().isLength({ max: 500 }).withMessage('Prompt must not exceed 500 characters'),
  body('duration').isInt({ min: 1, max: 30 }).withMessage('Duration must be 1-30 seconds'),
  body('motionStrength').isFloat({ min: 0, max: 1 }).withMessage('Motion strength must be 0-1'),
  body('model').isIn(['runway', 'stable-video', 'pika']).withMessage('Invalid model'),
];

const videoToVideoValidation = [
  body('inputVideoUrl').isURL().withMessage('Valid input video URL is required'),
  body('prompt').isLength({ min: 10, max: 1000 }).trim().withMessage('Prompt must be 10-1000 characters'),
  body('strength').isFloat({ min: 0, max: 1 }).withMessage('Strength must be 0-1'),
  body('preserveAudio').isBoolean().withMessage('Preserve audio must be boolean'),
  body('model').isIn(['runway', 'stable-video']).withMessage('Invalid model'),
];

const voiceGenerationValidation = [
  body('text').isLength({ min: 1, max: 5000 }).trim().withMessage('Text must be 1-5000 characters'),
  body('voiceId').isString().notEmpty().withMessage('Voice ID is required'),
  body('model').isIn(['elevenlabs', 'openai', 'azure']).withMessage('Invalid voice model'),
  body('language').isLength({ min: 2, max: 2 }).withMessage('Language must be 2-character code'),
  body('stability').optional().isFloat({ min: 0, max: 1 }).withMessage('Stability must be 0-1'),
  body('similarityBoost').optional().isFloat({ min: 0, max: 1 }).withMessage('Similarity boost must be 0-1'),
];

const lipSyncValidation = [
  body('videoUrl').isURL().withMessage('Valid video URL is required'),
  body('audioUrl').isURL().withMessage('Valid audio URL is required'),
  body('preserveOriginalAudio').optional().isBoolean().withMessage('Preserve original audio must be boolean'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid input data', errors.array());
  }
  next();
};

// Helper function to check user limits and credits
async function checkUserLimitsAndCredits(user: any, cost: number, duration: number, resolution: VideoResolution) {
  // Check subscription limits
  if (!canCreateVideo(duration, resolution, user.subscription)) {
    throw new ApiError(403, 'SUBSCRIPTION_REQUIRED', 'Subscription upgrade required for this video length/quality');
  }

  // Check credits
  if (user.credits < cost) {
    throw new ApiError(402, 'INSUFFICIENT_CREDITS', `Insufficient credits. Required: ${cost}, Available: ${user.credits}`);
  }

  // Check daily limits based on subscription
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dailyVideoCount = await prisma.video.count({
    where: {
      userId: user.id,
      createdAt: { gte: today },
    },
  });

  const dailyLimits = {
    FREE: 5,
    PRO: 50,
    BUSINESS: 200,
    ENTERPRISE: -1, // unlimited
  };

  const limit = dailyLimits[user.subscription as keyof typeof dailyLimits];
  if (limit !== -1 && dailyVideoCount >= limit) {
    throw new ApiError(429, 'RESOURCE_LIMIT_EXCEEDED', `Daily video limit reached: ${limit}`);
  }
}

// Text to Video Generation
router.post('/text-to-video', aiGenerationLimiter, textToVideoValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { prompt, duration, aspectRatio, style, model, seed, guidanceScale } = req.body;

  // Determine resolution based on user subscription
  const resolution = user.subscription === 'FREE' ? VideoResolution.SD_480P : 
                     user.subscription === 'PRO' ? VideoResolution.HD_720P :
                     VideoResolution.FHD_1080P;

  // Calculate cost
  const cost = calculateVideoCost(duration, resolution, user.subscription);

  // Check limits and credits
  await checkUserLimitsAndCredits(user, cost, duration, resolution);

  // Create video record
  const video = await prisma.video.create({
    data: {
      userId: user.id,
      title: `Generated: ${prompt.substring(0, 50)}...`,
      description: `Generated from prompt: ${prompt}`,
      resolution,
      status: 'QUEUED',
      settings: {
        includeWatermark: user.subscription === 'FREE',
        quality: 'high',
        outputFormat: 'mp4',
        compression: 'balanced',
      },
      processingData: {
        type: 'text-to-video',
        prompt,
        duration,
        aspectRatio,
        style,
        model,
        seed,
        guidanceScale,
        cost,
      },
    },
  });

  // Queue the generation job
  const job = await QueueManager.addVideoGenerationJob('text-to-video', {
    videoId: video.id,
    userId: user.id,
    prompt,
    duration,
    aspectRatio,
    style,
    model,
    seed,
    guidanceScale,
    resolution,
  }, {
    priority: user.subscription === 'FREE' ? 1 : 
              user.subscription === 'PRO' ? 5 : 10,
  });

  // Deduct credits
  await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: cost } },
  });

  // Log the generation request
  loggerHelpers.logUserAction(user.id, 'text_to_video', 'ai_generation', {
    videoId: video.id,
    model,
    duration,
    cost,
    jobId: job.id,
  });

  res.status(201).json({
    success: true,
    data: {
      video: {
        id: video.id,
        status: 'QUEUED',
        estimatedTime: `${Math.ceil(duration * 0.5)}-${Math.ceil(duration * 1)} minutes`,
      },
      job: {
        id: job.id,
      },
      cost,
      creditsRemaining: user.credits - cost,
    },
  });
}));

// Image to Video Generation
router.post('/image-to-video', aiGenerationLimiter, imageToVideoValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { imageUrl, prompt, duration, motionStrength, model } = req.body;

  // Determine resolution
  const resolution = user.subscription === 'FREE' ? VideoResolution.SD_480P : 
                     user.subscription === 'PRO' ? VideoResolution.HD_720P :
                     VideoResolution.FHD_1080P;

  // Calculate cost (image-to-video is typically more expensive)
  const baseCost = calculateVideoCost(duration, resolution, user.subscription);
  const cost = Math.ceil(baseCost * 1.5); // 50% more expensive

  // Check limits and credits
  await checkUserLimitsAndCredits(user, cost, duration, resolution);

  // Create video record
  const video = await prisma.video.create({
    data: {
      userId: user.id,
      title: `Image Animation: ${prompt || 'Motion from image'}`,
      description: `Generated from image with ${prompt ? `prompt: ${prompt}` : 'motion effects'}`,
      resolution,
      status: 'QUEUED',
      settings: {
        includeWatermark: user.subscription === 'FREE',
        quality: 'high',
        outputFormat: 'mp4',
        compression: 'balanced',
      },
      processingData: {
        type: 'image-to-video',
        imageUrl,
        prompt,
        duration,
        motionStrength,
        model,
        cost,
      },
    },
  });

  // Queue the generation job
  const job = await QueueManager.addVideoGenerationJob('image-to-video', {
    videoId: video.id,
    userId: user.id,
    imageUrl,
    prompt,
    duration,
    motionStrength,
    model,
    resolution,
  }, {
    priority: user.subscription === 'FREE' ? 1 : 
              user.subscription === 'PRO' ? 5 : 10,
  });

  // Deduct credits
  await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: cost } },
  });

  // Log the generation request
  loggerHelpers.logUserAction(user.id, 'image_to_video', 'ai_generation', {
    videoId: video.id,
    model,
    duration,
    cost,
    jobId: job.id,
  });

  res.status(201).json({
    success: true,
    data: {
      video: {
        id: video.id,
        status: 'QUEUED',
        estimatedTime: `${Math.ceil(duration * 0.3)}-${Math.ceil(duration * 0.6)} minutes`,
      },
      job: {
        id: job.id,
      },
      cost,
      creditsRemaining: user.credits - cost,
    },
  });
}));

// Video to Video Transformation
router.post('/video-to-video', requireSubscription('PRO'), aiGenerationLimiter, videoToVideoValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { inputVideoUrl, prompt, strength, preserveAudio, model } = req.body;

  // For video-to-video, we estimate duration from the input video (this would be determined by analyzing the input)
  const estimatedDuration = 30; // Placeholder - would analyze input video
  
  const resolution = user.subscription === 'PRO' ? VideoResolution.HD_720P : VideoResolution.FHD_1080P;
  
  // Calculate cost (video-to-video is the most expensive)
  const baseCost = calculateVideoCost(estimatedDuration, resolution, user.subscription);
  const cost = Math.ceil(baseCost * 2); // 100% more expensive

  // Check limits and credits
  await checkUserLimitsAndCredits(user, cost, estimatedDuration, resolution);

  // Create video record
  const video = await prisma.video.create({
    data: {
      userId: user.id,
      title: `Video Transformation: ${prompt.substring(0, 50)}...`,
      description: `Video-to-video transformation with prompt: ${prompt}`,
      resolution,
      status: 'QUEUED',
      settings: {
        includeWatermark: false, // No watermark for PRO+
        quality: 'high',
        outputFormat: 'mp4',
        compression: 'balanced',
      },
      processingData: {
        type: 'video-to-video',
        inputVideoUrl,
        prompt,
        strength,
        preserveAudio,
        model,
        cost,
      },
    },
  });

  // Queue the generation job
  const job = await QueueManager.addVideoGenerationJob('video-to-video', {
    videoId: video.id,
    userId: user.id,
    inputVideoUrl,
    prompt,
    strength,
    preserveAudio,
    model,
    resolution,
  }, {
    priority: user.subscription === 'PRO' ? 5 : 10,
  });

  // Deduct credits
  await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: cost } },
  });

  // Log the generation request
  loggerHelpers.logUserAction(user.id, 'video_to_video', 'ai_generation', {
    videoId: video.id,
    model,
    cost,
    jobId: job.id,
  });

  res.status(201).json({
    success: true,
    data: {
      video: {
        id: video.id,
        status: 'QUEUED',
        estimatedTime: '10-20 minutes',
      },
      job: {
        id: job.id,
      },
      cost,
      creditsRemaining: user.credits - cost,
    },
  });
}));

// Voice Generation
router.post('/generate-voice', aiGenerationLimiter, voiceGenerationValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { text, voiceId, model, language, stability, similarityBoost } = req.body;

  // Calculate cost based on text length
  const characterCount = text.length;
  const baseCharacterCost = 0.01; // $0.01 per character equivalent in credits
  const cost = Math.ceil(characterCount * baseCharacterCost);

  // Check credits
  if (user.credits < cost) {
    throw new ApiError(402, 'INSUFFICIENT_CREDITS', `Insufficient credits. Required: ${cost}, Available: ${user.credits}`);
  }

  // Queue the voice generation job
  const job = await QueueManager.addAudioGenerationJob('voice-synthesis', {
    userId: user.id,
    text,
    voiceId,
    model,
    language,
    stability,
    similarityBoost,
  });

  // Deduct credits
  await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: cost } },
  });

  // Log the generation request
  loggerHelpers.logUserAction(user.id, 'generate_voice', 'ai_generation', {
    model,
    characterCount,
    cost,
    jobId: job.id,
  });

  res.status(201).json({
    success: true,
    data: {
      job: {
        id: job.id,
        estimatedTime: '30-60 seconds',
      },
      cost,
      creditsRemaining: user.credits - cost,
    },
  });
}));

// Lip Sync Generation
router.post('/lip-sync', requireSubscription('BUSINESS'), aiGenerationLimiter, lipSyncValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { videoUrl, audioUrl, preserveOriginalAudio } = req.body;

  // Lip sync is a premium feature with high cost
  const cost = 50; // Fixed cost for lip sync

  // Check credits
  if (user.credits < cost) {
    throw new ApiError(402, 'INSUFFICIENT_CREDITS', `Insufficient credits. Required: ${cost}, Available: ${user.credits}`);
  }

  // Create video record for the result
  const video = await prisma.video.create({
    data: {
      userId: user.id,
      title: 'Lip Sync Video',
      description: 'Generated with AI lip sync',
      resolution: VideoResolution.HD_720P,
      status: 'QUEUED',
      settings: {
        includeWatermark: false,
        quality: 'high',
        outputFormat: 'mp4',
        compression: 'balanced',
      },
      processingData: {
        type: 'lip-sync',
        videoUrl,
        audioUrl,
        preserveOriginalAudio,
        cost,
      },
    },
  });

  // Queue the lip sync job
  const job = await QueueManager.addAudioGenerationJob('lip-sync', {
    videoId: video.id,
    userId: user.id,
    videoUrl,
    audioUrl,
    preserveOriginalAudio,
  });

  // Deduct credits
  await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: cost } },
  });

  // Log the generation request
  loggerHelpers.logUserAction(user.id, 'lip_sync', 'ai_generation', {
    videoId: video.id,
    cost,
    jobId: job.id,
  });

  res.status(201).json({
    success: true,
    data: {
      video: {
        id: video.id,
        status: 'QUEUED',
        estimatedTime: '5-15 minutes',
      },
      job: {
        id: job.id,
      },
      cost,
      creditsRemaining: user.credits - cost,
    },
  });
}));

// Get available AI models and their pricing
router.get('/models', asyncHandler(async (req, res) => {
  const models = {
    textToVideo: [
      {
        id: 'openai',
        name: 'OpenAI Sora',
        description: 'High-quality video generation from text prompts',
        maxDuration: 60,
        aspectRatios: ['16:9', '9:16', '1:1'],
        costPerSecond: 0.5,
        features: ['Photorealistic', 'Complex scenes', 'Camera movements'],
      },
      {
        id: 'runway',
        name: 'Runway Gen-3',
        description: 'Fast and versatile video generation',
        maxDuration: 30,
        aspectRatios: ['16:9', '9:16', '1:1', '4:3'],
        costPerSecond: 0.3,
        features: ['Quick generation', 'Style control', 'Multiple formats'],
      },
      {
        id: 'stable-video',
        name: 'Stable Video Diffusion',
        description: 'Open-source video generation model',
        maxDuration: 25,
        aspectRatios: ['16:9', '1:1'],
        costPerSecond: 0.2,
        features: ['Cost-effective', 'Good quality', 'Customizable'],
      },
    ],
    imageToVideo: [
      {
        id: 'runway',
        name: 'Runway Gen-3 Image',
        description: 'Animate still images with motion',
        maxDuration: 10,
        costPerSecond: 0.4,
        features: ['Natural motion', 'Preserve details', 'Camera movement'],
      },
      {
        id: 'stable-video',
        name: 'SVD Image Animation',
        description: 'Stable diffusion for image animation',
        maxDuration: 4,
        costPerSecond: 0.15,
        features: ['Quick animation', 'Smooth motion', 'Budget-friendly'],
      },
    ],
    voiceGeneration: [
      {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        description: 'Premium voice cloning and synthesis',
        languages: 29,
        costPerCharacter: 0.001,
        features: ['Voice cloning', 'Emotional control', 'Multiple languages'],
      },
      {
        id: 'openai',
        name: 'OpenAI TTS',
        description: 'High-quality text-to-speech',
        voices: 6,
        costPerCharacter: 0.0005,
        features: ['Natural voices', 'Fast generation', 'Reliable'],
      },
    ],
  };

  res.json({
    success: true,
    data: { models },
  });
}));

// Get user's AI generation history
router.get('/history', asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const history = await prisma.video.findMany({
    where: {
      userId: user.id,
      processingData: { not: null },
    },
    select: {
      id: true,
      title: true,
      status: true,
      processingData: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: Number(limit),
  });

  const total = await prisma.video.count({
    where: {
      userId: user.id,
      processingData: { not: null },
    },
  });

  res.json({
    success: true,
    data: {
      history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
}));

export default router;