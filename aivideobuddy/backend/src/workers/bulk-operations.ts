import { Job } from 'bull';
import { QueueManager } from '../config/queues';
import { logger } from '../utils/logger';

export async function processBulkOperations(job: Job): Promise<void> {
  const { type, data } = job.data;

  switch (type) {
    case 'bulk-video-generation':
      return processBulkVideoGeneration(job);
    case 'bulk-processing':
      return processBulkProcessing(job);
    default:
      throw new Error(`Unknown bulk operation type: ${type}`);
  }
}

async function processBulkVideoGeneration(job: Job): Promise<void> {
  const { userId, videos, settings } = job.data;

  try {
    logger.info(`Starting bulk video generation for ${videos.length} videos`);

    for (let i = 0; i < videos.length; i++) {
      const videoData = videos[i];
      
      // Queue individual video generation
      await QueueManager.addVideoGenerationJob('text-to-video', {
        ...videoData,
        userId,
        bulkJobId: job.id,
        bulkIndex: i,
      }, {
        priority: settings?.priority === 'high' ? 5 : 1,
      });
      
      // Update bulk job progress
      job.progress(Math.round(((i + 1) / videos.length) * 100));
    }

    logger.info(`Bulk video generation queued for ${videos.length} videos`);
  } catch (error) {
    logger.error('Bulk video generation failed:', error);
    throw error;
  }
}

async function processBulkProcessing(job: Job): Promise<void> {
  const { userId, operations } = job.data;

  try {
    logger.info(`Starting bulk processing for ${operations.length} operations`);

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      await QueueManager.addVideoProcessingJob(operation.type, {
        ...operation,
        userId,
        bulkJobId: job.id,
      });
      
      job.progress(Math.round(((i + 1) / operations.length) * 100));
    }

    logger.info(`Bulk processing queued for ${operations.length} operations`);
  } catch (error) {
    logger.error('Bulk processing failed:', error);
    throw error;
  }
}