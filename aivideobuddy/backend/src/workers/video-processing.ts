import { Job } from 'bull';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { StorageService } from '../config/storage';
import { io } from '../index';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic as string);

const storage = StorageService.getInstance();

export async function processVideoProcessing(job: Job): Promise<void> {
  const { type } = job.data;

  switch (type) {
    case 'encode':
      return processVideoEncoding(job);
    case 'enhance':
      return processVideoEnhancement(job);
    case 'composite':
      return processVideoComposite(job);
    default:
      throw new Error(`Unknown video processing type: ${type}`);
  }
}

async function processVideoEncoding(job: Job): Promise<void> {
  const { videoId, inputUrl, outputFormat, quality, userId } = job.data;

  try {
    logger.info(`Starting video encoding for video ${videoId}`);

    // Download input video
    const inputBuffer = await downloadVideo(inputUrl);
    const inputPath = `/tmp/input_${videoId}.mp4`;
    const outputPath = `/tmp/output_${videoId}.${outputFormat}`;

    // Save input to temporary file
    require('fs').writeFileSync(inputPath, inputBuffer);

    // Configure FFmpeg based on quality settings
    const qualitySettings = getQualitySettings(quality);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec(qualitySettings.videoCodec)
        .audioCodec(qualitySettings.audioCodec)
        .videoBitrate(qualitySettings.videoBitrate)
        .audioBitrate(qualitySettings.audioBitrate)
        .format(outputFormat)
        .on('progress', (progress) => {
          const percent = Math.round(progress.percent || 0);
          emitProgress(userId, videoId, percent, 'encoding');
        })
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Upload processed video
    const outputBuffer = require('fs').readFileSync(outputPath);
    const uploadResult = await storage.uploadVideo(
      outputBuffer,
      `encoded_${videoId}.${outputFormat}`,
      userId
    );

    // Update video record
    await prisma.video.update({
      where: { id: videoId },
      data: {
        videoUrl: uploadResult.url,
        metadata: {
          encoded: true,
          format: outputFormat,
          quality,
          fileSize: uploadResult.size,
        },
      },
    });

    // Cleanup temporary files
    require('fs').unlinkSync(inputPath);
    require('fs').unlinkSync(outputPath);

    logger.info(`Video encoding completed for video ${videoId}`);

  } catch (error) {
    logger.error(`Video encoding failed for video ${videoId}:`, error);
    throw error;
  }
}

async function processVideoEnhancement(job: Job): Promise<void> {
  const { videoId, inputUrl, enhancementType, userId } = job.data;

  try {
    logger.info(`Starting video enhancement for video ${videoId}`);

    // Download input video
    const inputBuffer = await downloadVideo(inputUrl);
    const inputPath = `/tmp/input_${videoId}.mp4`;
    const outputPath = `/tmp/enhanced_${videoId}.mp4`;

    require('fs').writeFileSync(inputPath, inputBuffer);

    // Apply enhancement based on type
    const enhancementFilters = getEnhancementFilters(enhancementType);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(enhancementFilters)
        .on('progress', (progress) => {
          const percent = Math.round(progress.percent || 0);
          emitProgress(userId, videoId, percent, 'enhancing');
        })
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Upload enhanced video
    const outputBuffer = require('fs').readFileSync(outputPath);
    const uploadResult = await storage.uploadVideo(
      outputBuffer,
      `enhanced_${videoId}.mp4`,
      userId
    );

    // Update video record
    await prisma.video.update({
      where: { id: videoId },
      data: {
        videoUrl: uploadResult.url,
        metadata: {
          enhanced: true,
          enhancementType,
          fileSize: uploadResult.size,
        },
      },
    });

    // Cleanup
    require('fs').unlinkSync(inputPath);
    require('fs').unlinkSync(outputPath);

    logger.info(`Video enhancement completed for video ${videoId}`);

  } catch (error) {
    logger.error(`Video enhancement failed for video ${videoId}:`, error);
    throw error;
  }
}

async function processVideoComposite(job: Job): Promise<void> {
  const { videoId, inputs, composition, userId } = job.data;

  try {
    logger.info(`Starting video composition for video ${videoId}`);

    // This would involve complex video composition logic
    // For now, we'll simulate the process

    emitProgress(userId, videoId, 25, 'compositing');
    await new Promise(resolve => setTimeout(resolve, 5000));

    emitProgress(userId, videoId, 50, 'compositing');
    await new Promise(resolve => setTimeout(resolve, 5000));

    emitProgress(userId, videoId, 75, 'compositing');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Simulate final result
    const mockBuffer = Buffer.from('mock composite video');
    const uploadResult = await storage.uploadVideo(
      mockBuffer,
      `composite_${videoId}.mp4`,
      userId
    );

    await prisma.video.update({
      where: { id: videoId },
      data: {
        videoUrl: uploadResult.url,
        status: 'COMPLETED',
      },
    });

    emitProgress(userId, videoId, 100, 'completed');

    logger.info(`Video composition completed for video ${videoId}`);

  } catch (error) {
    logger.error(`Video composition failed for video ${videoId}:`, error);
    throw error;
  }
}

// Helper functions
async function downloadVideo(url: string): Promise<Buffer> {
  const axios = require('axios');
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

function getQualitySettings(quality: string) {
  const settings = {
    low: {
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '500k',
      audioBitrate: '64k',
    },
    medium: {
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '1500k',
      audioBitrate: '128k',
    },
    high: {
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '3000k',
      audioBitrate: '192k',
    },
    ultra: {
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '6000k',
      audioBitrate: '320k',
    },
  };

  return settings[quality as keyof typeof settings] || settings.medium;
}

function getEnhancementFilters(type: string): string[] {
  const filters = {
    upscale: ['scale=1920:1080:flags=lanczos'],
    denoise: ['hqdn3d=4:3:6:4.5'],
    sharpen: ['unsharp=5:5:1.0:5:5:0.0'],
    colorize: ['eq=contrast=1.2:brightness=0.1:saturation=1.3'],
  };

  return filters[type as keyof typeof filters] || [];
}

function emitProgress(userId: string, videoId: string, progress: number, stage: string): void {
  io.to(`user_${userId}`).emit('video_progress', {
    videoId,
    progress,
    stage,
    timestamp: new Date().toISOString(),
  });
}