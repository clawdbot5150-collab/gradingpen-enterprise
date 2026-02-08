import { Job } from 'bull';
import { prisma } from '../config/database';
import { StorageService } from '../config/storage';
import { logger, loggerHelpers } from '../utils/logger';
import { io } from '../index';
import OpenAI from 'openai';
import Replicate from 'replicate';
import axios from 'axios';

const storage = StorageService.getInstance();

// Initialize AI service clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Runway ML API client (simplified)
class RunwayAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.RUNWAY_API_KEY!;
    this.baseUrl = 'https://api.runwayml.com/v1';
  }

  async generateVideo(params: any) {
    try {
      const response = await axios.post(`${this.baseUrl}/generate`, params, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Runway API error:', error);
      throw error;
    }
  }

  async getGenerationStatus(generationId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/generations/${generationId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Runway API status check error:', error);
      throw error;
    }
  }
}

const runway = new RunwayAPI();

// Main video generation processor
export async function processVideoGeneration(job: Job): Promise<void> {
  const { 
    videoId, 
    userId, 
    prompt, 
    duration, 
    aspectRatio, 
    style, 
    model, 
    seed, 
    guidanceScale,
    resolution,
    imageUrl, // For image-to-video
    inputVideoUrl, // For video-to-video
    motionStrength, // For image-to-video
    strength, // For video-to-video
    preserveAudio, // For video-to-video
  } = job.data;

  try {
    logger.info(`Starting video generation for video ${videoId}`, {
      model,
      duration,
      resolution,
      jobId: job.id,
    });

    // Update video status to processing
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'PROCESSING',
        processingData: {
          ...job.data,
          stage: 'initializing',
          progress: 0,
          startedAt: new Date().toISOString(),
        },
      },
    });

    // Emit progress update
    emitProgress(userId, videoId, 0, 'initializing');

    let generationResult;
    
    // Route to appropriate AI model
    switch (model) {
      case 'openai':
        generationResult = await generateWithOpenAI(job.data, job);
        break;
      case 'runway':
        generationResult = await generateWithRunway(job.data, job);
        break;
      case 'stable-video':
        generationResult = await generateWithStableVideo(job.data, job);
        break;
      default:
        throw new Error(`Unsupported model: ${model}`);
    }

    // Upload generated video to storage
    emitProgress(userId, videoId, 80, 'uploading');
    
    const videoBuffer = await downloadVideo(generationResult.videoUrl);
    const uploadResult = await storage.uploadVideo(
      videoBuffer, 
      `generated-${videoId}.mp4`, 
      userId
    );

    // Generate thumbnail
    emitProgress(userId, videoId, 90, 'generating_thumbnail');
    const thumbnailBuffer = await generateThumbnail(generationResult.videoUrl);
    const thumbnailResult = await storage.uploadThumbnail(
      thumbnailBuffer,
      `thumb-${videoId}.jpg`,
      userId
    );

    // Update video record with results
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'COMPLETED',
        videoUrl: uploadResult.url,
        thumbnailUrl: thumbnailResult.url,
        duration: generationResult.duration || duration,
        metadata: {
          generatedWith: model,
          originalPrompt: prompt,
          processingTime: Date.now() - new Date(job.data.startedAt || Date.now()).getTime(),
          fileSize: uploadResult.size,
          ...generationResult.metadata,
        },
        processingData: {
          ...job.data,
          stage: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
          result: generationResult,
        },
      },
    });

    // Emit completion
    emitProgress(userId, videoId, 100, 'completed');
    emitVideoCompleted(userId, videoId, {
      videoUrl: uploadResult.url,
      thumbnailUrl: thumbnailResult.url,
    });

    // Log successful completion
    loggerHelpers.logVideoProcessing(videoId, 'generation', 'completed', {
      model,
      duration: generationResult.duration,
      processingTime: Date.now() - new Date(job.data.startedAt || Date.now()).getTime(),
    });

    logger.info(`Video generation completed for video ${videoId}`);

  } catch (error) {
    logger.error(`Video generation failed for video ${videoId}:`, error);

    // Update video status to failed
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingData: {
          ...job.data,
          stage: 'failed',
          progress: 0,
          failedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });

    // Refund credits on failure
    await refundCredits(userId, job.data.cost || 0);

    // Emit failure
    emitProgress(userId, videoId, 0, 'failed');
    emitVideoFailed(userId, videoId, error instanceof Error ? error.message : 'Unknown error');

    // Log failure
    loggerHelpers.logVideoProcessing(videoId, 'generation', 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

// OpenAI Video Generation (Sora)
async function generateWithOpenAI(data: any, job: Job) {
  const { videoId, userId, prompt, duration, aspectRatio } = data;
  
  emitProgress(userId, videoId, 10, 'ai_processing');

  try {
    // Note: This is a placeholder for Sora API which may not be publicly available yet
    // In practice, you would use the actual OpenAI video generation API
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are simulating video generation. Return a JSON response with videoUrl and metadata."
        },
        {
          role: "user",
          content: `Generate video for: ${prompt}`
        }
      ],
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, duration * 1000));

    // In a real implementation, this would be the actual video URL from OpenAI
    return {
      videoUrl: `https://api.openai.com/v1/videos/${Date.now()}.mp4`,
      duration,
      metadata: {
        prompt,
        aspectRatio,
        model: 'openai-sora',
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('OpenAI video generation error:', error);
    throw new Error('OpenAI video generation failed');
  }
}

// Runway ML Video Generation
async function generateWithRunway(data: any, job: Job) {
  const { videoId, userId, prompt, duration, aspectRatio, imageUrl, inputVideoUrl } = data;

  emitProgress(userId, videoId, 10, 'ai_processing');

  try {
    let generationParams;
    
    if (imageUrl) {
      // Image-to-video
      generationParams = {
        type: 'image_to_video',
        image: imageUrl,
        prompt,
        duration,
        motion_strength: data.motionStrength,
      };
    } else if (inputVideoUrl) {
      // Video-to-video
      generationParams = {
        type: 'video_to_video',
        video: inputVideoUrl,
        prompt,
        strength: data.strength,
        preserve_audio: data.preserveAudio,
      };
    } else {
      // Text-to-video
      generationParams = {
        type: 'text_to_video',
        prompt,
        duration,
        aspect_ratio: aspectRatio,
        style: data.style,
      };
    }

    // Start generation
    const generation = await runway.generateVideo(generationParams);
    const generationId = generation.id;

    // Poll for completion
    let status = 'processing';
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max

    while (status === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await runway.getGenerationStatus(generationId);
      status = statusResponse.status;
      
      const progress = Math.min(10 + (attempts / maxAttempts) * 70, 80);
      emitProgress(userId, videoId, progress, 'ai_processing');
      
      attempts++;
    }

    if (status !== 'completed') {
      throw new Error('Runway generation timed out or failed');
    }

    const finalResult = await runway.getGenerationStatus(generationId);

    return {
      videoUrl: finalResult.video_url,
      duration: finalResult.duration || duration,
      metadata: {
        prompt,
        aspectRatio,
        model: 'runway-gen3',
        generationId,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Runway video generation error:', error);
    throw new Error('Runway video generation failed');
  }
}

// Stable Video Diffusion
async function generateWithStableVideo(data: any, job: Job) {
  const { videoId, userId, prompt, duration, aspectRatio, imageUrl } = data;

  emitProgress(userId, videoId, 10, 'ai_processing');

  try {
    let modelName;
    let input;

    if (imageUrl) {
      // Image-to-video with Stable Video Diffusion
      modelName = "stability-ai/stable-video-diffusion:3f0457e4619daec7fcf5b21c7afa24b8eeb3f87cb3c2a8f2d8a0b3de1e2d46e9";
      input = {
        image: imageUrl,
        motion_bucket_id: Math.floor(data.motionStrength * 255),
        cond_aug: 0.02,
        num_frames: Math.min(duration * 8, 25), // Max 25 frames
      };
    } else {
      // Text-to-video (using a hypothetical stable video model)
      modelName = "stability-ai/stable-video-diffusion:text-to-video";
      input = {
        prompt,
        num_frames: Math.min(duration * 8, 25),
        width: aspectRatio === '16:9' ? 768 : 512,
        height: aspectRatio === '16:9' ? 432 : 512,
        guidance_scale: data.guidanceScale || 7.5,
        num_inference_steps: 25,
      };
    }

    const prediction = await replicate.run(modelName, { input });

    // Wait for completion
    let finalPrediction = prediction;
    while (finalPrediction.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 3000));
      // In practice, you'd use replicate.predictions.get(prediction.id)
      emitProgress(userId, videoId, Math.min(10 + Math.random() * 70, 80), 'ai_processing');
    }

    if (finalPrediction.status !== 'succeeded') {
      throw new Error('Stable Video Diffusion generation failed');
    }

    return {
      videoUrl: Array.isArray(finalPrediction.output) ? finalPrediction.output[0] : finalPrediction.output,
      duration: duration,
      metadata: {
        prompt,
        aspectRatio,
        model: 'stable-video-diffusion',
        predictionId: finalPrediction.id,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Stable Video Diffusion generation error:', error);
    throw new Error('Stable Video Diffusion generation failed');
  }
}

// Helper functions
async function downloadVideo(videoUrl: string): Promise<Buffer> {
  try {
    const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    logger.error('Failed to download generated video:', error);
    throw new Error('Failed to download generated video');
  }
}

async function generateThumbnail(videoUrl: string): Promise<Buffer> {
  try {
    // This is a simplified thumbnail generation
    // In practice, you'd use FFmpeg to extract a frame from the video
    
    // For now, create a simple placeholder thumbnail
    const canvas = require('canvas');
    const canvasElement = canvas.createCanvas(320, 180);
    const ctx = canvasElement.getContext('2d');
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 320, 180);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Video Thumbnail', 160, 90);
    
    return canvasElement.toBuffer('image/jpeg');
  } catch (error) {
    logger.error('Failed to generate thumbnail:', error);
    // Return a default thumbnail buffer
    return Buffer.alloc(0);
  }
}

async function refundCredits(userId: string, amount: number): Promise<void> {
  if (amount > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    });
    
    loggerHelpers.logUserAction(userId, 'credits_refunded', 'credits', { amount });
  }
}

// WebSocket event emitters
function emitProgress(userId: string, videoId: string, progress: number, stage: string): void {
  io.to(`user_${userId}`).emit('video_progress', {
    videoId,
    progress,
    stage,
    timestamp: new Date().toISOString(),
  });
}

function emitVideoCompleted(userId: string, videoId: string, result: any): void {
  io.to(`user_${userId}`).emit('video_completed', {
    videoId,
    result,
    timestamp: new Date().toISOString(),
  });
}

function emitVideoFailed(userId: string, videoId: string, error: string): void {
  io.to(`user_${userId}`).emit('video_failed', {
    videoId,
    error,
    timestamp: new Date().toISOString(),
  });
}