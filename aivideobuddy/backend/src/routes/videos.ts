import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../middleware/error-handler';
import { requireSubscription, userRateLimit } from '../middleware/auth';
import { createSubscriptionBasedLimiter } from '../middleware/rate-limiter';
import { QueueManager } from '../config/queues';
import { loggerHelpers } from '../utils/logger';
import { canCreateVideo, calculateVideoCost } from '@aivideobuddy/shared';

const router = express.Router();

// Validation rules
const createVideoValidation = [
  body('title').isLength({ min: 1, max: 100 }).trim().withMessage('Title must be 1-100 characters'),
  body('description').optional().isLength({ max: 500 }).trim().withMessage('Description must not exceed 500 characters'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
];

const updateVideoValidation = [
  param('id').isString().withMessage('Video ID is required'),
  body('title').optional().isLength({ min: 1, max: 100 }).trim().withMessage('Title must be 1-100 characters'),
  body('description').optional().isLength({ max: 500 }).trim().withMessage('Description must not exceed 500 characters'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
];

const listVideosValidation = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['DRAFT', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'title', 'duration']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid input data', errors.array());
  }
  next();
};

// Rate limiting for video operations
const videoCreationLimiter = createSubscriptionBasedLimiter(5, 50, 200, 1000, 60 * 60 * 1000); // Per hour
const videoListLimiter = createSubscriptionBasedLimiter(100, 500, 2000, 10000, 60 * 60 * 1000); // Per hour

// List user's videos
router.get('/', videoListLimiter, listVideosValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { 
    page = 1, 
    limit = 10, 
    status, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search 
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build where clause
  const where: any = { userId: user.id };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  // Get total count for pagination
  const total = await prisma.video.count({ where });

  // Get videos with pagination
  const videos = await prisma.video.findMany({
    where,
    skip,
    take: Number(limit),
    orderBy: { [sortBy as string]: sortOrder },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      videoUrl: true,
      duration: true,
      resolution: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    data: {
      videos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
}));

// Get single video
router.get('/:id', param('id').isString(), handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const video = await prisma.video.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      videoUrl: true,
      duration: true,
      resolution: true,
      status: true,
      metadata: true,
      settings: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!video) {
    throw new ApiError(404, 'NOT_FOUND', 'Video not found');
  }

  res.json({
    success: true,
    data: { video },
  });
}));

// Create new video
router.post('/', videoCreationLimiter, createVideoValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { title, description, settings } = req.body;

  const defaultSettings = {
    includeWatermark: user.subscription === 'FREE',
    quality: 'medium',
    outputFormat: 'mp4',
    compression: 'balanced',
    ...settings,
  };

  // Create video record
  const video = await prisma.video.create({
    data: {
      userId: user.id,
      title,
      description,
      resolution: 'HD_720P', // Default resolution
      status: 'DRAFT',
      settings: defaultSettings,
    },
    select: {
      id: true,
      title: true,
      description: true,
      resolution: true,
      status: true,
      settings: true,
      createdAt: true,
    },
  });

  // Log video creation
  loggerHelpers.logUserAction(user.id, 'create_video', 'video', { 
    videoId: video.id,
    title: video.title 
  });

  res.status(201).json({
    success: true,
    data: { video },
  });
}));

// Update video
router.put('/:id', updateVideoValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { title, description, settings } = req.body;

  // Check if video exists and belongs to user
  const existingVideo = await prisma.video.findFirst({
    where: { id, userId: user.id },
  });

  if (!existingVideo) {
    throw new ApiError(404, 'NOT_FOUND', 'Video not found');
  }

  // Don't allow updates to processing videos
  if (['PROCESSING', 'QUEUED'].includes(existingVideo.status)) {
    throw new ApiError(400, 'INVALID_STATE', 'Cannot update video while processing');
  }

  // Update video
  const video = await prisma.video.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(settings && { settings: { ...existingVideo.settings, ...settings } }),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      description: true,
      resolution: true,
      status: true,
      settings: true,
      updatedAt: true,
    },
  });

  // Log video update
  loggerHelpers.logUserAction(user.id, 'update_video', 'video', { 
    videoId: video.id,
    changes: { title, description, settings } 
  });

  res.json({
    success: true,
    data: { video },
  });
}));

// Delete video
router.delete('/:id', param('id').isString(), handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  // Check if video exists and belongs to user
  const video = await prisma.video.findFirst({
    where: { id, userId: user.id },
  });

  if (!video) {
    throw new ApiError(404, 'NOT_FOUND', 'Video not found');
  }

  // Don't allow deletion of processing videos
  if (video.status === 'PROCESSING') {
    throw new ApiError(400, 'INVALID_STATE', 'Cannot delete video while processing');
  }

  // Cancel queued jobs if any
  if (video.status === 'QUEUED') {
    // TODO: Cancel queued jobs
  }

  // Delete video files from storage if they exist
  if (video.videoUrl || video.thumbnailUrl) {
    // TODO: Delete files from S3/R2
  }

  // Delete video record
  await prisma.video.delete({ where: { id } });

  // Log video deletion
  loggerHelpers.logUserAction(user.id, 'delete_video', 'video', { 
    videoId: id,
    title: video.title 
  });

  res.json({
    success: true,
    data: { message: 'Video deleted successfully' },
  });
}));

// Get video analytics
router.get('/:id/analytics', requireSubscription('PRO'), param('id').isString(), handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  // Check if video belongs to user
  const video = await prisma.video.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!video) {
    throw new ApiError(404, 'NOT_FOUND', 'Video not found');
  }

  // Get analytics data
  const analytics = await prisma.videoAnalytics.findMany({
    where: { videoId: id },
    orderBy: { date: 'desc' },
    take: 30, // Last 30 days
  });

  res.json({
    success: true,
    data: { analytics },
  });
}));

// Duplicate video
router.post('/:id/duplicate', videoCreationLimiter, param('id').isString(), handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  // Get original video
  const originalVideo = await prisma.video.findFirst({
    where: { id, userId: user.id },
  });

  if (!originalVideo) {
    throw new ApiError(404, 'NOT_FOUND', 'Video not found');
  }

  // Create duplicate
  const duplicateVideo = await prisma.video.create({
    data: {
      userId: user.id,
      title: `${originalVideo.title} (Copy)`,
      description: originalVideo.description,
      resolution: originalVideo.resolution,
      status: 'DRAFT',
      settings: originalVideo.settings,
    },
    select: {
      id: true,
      title: true,
      description: true,
      resolution: true,
      status: true,
      settings: true,
      createdAt: true,
    },
  });

  // Log video duplication
  loggerHelpers.logUserAction(user.id, 'duplicate_video', 'video', { 
    originalVideoId: id,
    duplicateVideoId: duplicateVideo.id 
  });

  res.status(201).json({
    success: true,
    data: { video: duplicateVideo },
  });
}));

// Export video in different format
router.post('/:id/export', requireSubscription('PRO'), param('id').isString(), handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { format = 'mp4', quality = 'high' } = req.body;

  // Check if video exists and is completed
  const video = await prisma.video.findFirst({
    where: { id, userId: user.id, status: 'COMPLETED' },
  });

  if (!video) {
    throw new ApiError(404, 'NOT_FOUND', 'Video not found or not completed');
  }

  if (!video.videoUrl) {
    throw new ApiError(400, 'INVALID_STATE', 'Video file not available');
  }

  // Check if user has enough credits for export
  const exportCost = format === 'mp4' ? 5 : 10; // Different costs for different formats
  if (user.credits < exportCost) {
    throw new ApiError(402, 'INSUFFICIENT_CREDITS', 'Not enough credits for export');
  }

  // Queue export job
  const job = await QueueManager.addVideoProcessingJob('encode', {
    videoId: id,
    inputUrl: video.videoUrl,
    outputFormat: format,
    quality,
    userId: user.id,
  });

  // Deduct credits
  await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: exportCost } },
  });

  // Log video export
  loggerHelpers.logUserAction(user.id, 'export_video', 'video', { 
    videoId: id,
    format,
    quality,
    jobId: job.id 
  });

  res.json({
    success: true,
    data: { 
      message: 'Export started',
      jobId: job.id,
      estimatedTime: '5-10 minutes',
    },
  });
}));

// Get video processing status
router.get('/:id/status', param('id').isString(), handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const video = await prisma.video.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      status: true,
      processingData: true,
      errorMessage: true,
    },
  });

  if (!video) {
    throw new ApiError(404, 'NOT_FOUND', 'Video not found');
  }

  // Extract progress information
  const processingData = video.processingData as any;
  const progress = processingData?.progress || 0;
  const stage = processingData?.stage || 'initializing';

  res.json({
    success: true,
    data: {
      id: video.id,
      status: video.status,
      progress,
      stage,
      error: video.errorMessage,
    },
  });
}));

export default router;