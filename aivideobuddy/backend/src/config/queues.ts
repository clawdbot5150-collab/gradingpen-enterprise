import Bull, { Queue, Job } from 'bull';
import { logger } from '../utils/logger';
import { 
  processVideoGeneration,
  processVideoProcessing,
  processAudioGeneration,
  processBulkOperations,
  processAnalyticsCalculation,
  processEmailNotifications,
  processWebhookDelivery
} from '../workers';

// Queue instances
let videoGenerationQueue: Queue;
let videoProcessingQueue: Queue;
let audioGenerationQueue: Queue;
let bulkOperationQueue: Queue;
let analyticsQueue: Queue;
let emailQueue: Queue;
let webhookQueue: Queue;

// Queue configuration
const defaultQueueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// High priority queue config for real-time operations
const priorityQueueConfig = {
  ...defaultQueueConfig,
  defaultJobOptions: {
    ...defaultQueueConfig.defaultJobOptions,
    priority: 1,
  },
};

// Low priority queue config for bulk operations
const bulkQueueConfig = {
  ...defaultQueueConfig,
  defaultJobOptions: {
    ...defaultQueueConfig.defaultJobOptions,
    priority: -1,
    delay: 1000, // Small delay for bulk operations
  },
};

export async function initializeQueues(): Promise<void> {
  try {
    // Initialize all queues
    videoGenerationQueue = new Bull('video-generation', priorityQueueConfig);
    videoProcessingQueue = new Bull('video-processing', priorityQueueConfig);
    audioGenerationQueue = new Bull('audio-generation', priorityQueueConfig);
    bulkOperationQueue = new Bull('bulk-operations', bulkQueueConfig);
    analyticsQueue = new Bull('analytics', defaultQueueConfig);
    emailQueue = new Bull('email-notifications', defaultQueueConfig);
    webhookQueue = new Bull('webhook-delivery', defaultQueueConfig);

    // Set up processors
    videoGenerationQueue.process('text-to-video', 5, processVideoGeneration);
    videoGenerationQueue.process('image-to-video', 5, processVideoGeneration);
    videoGenerationQueue.process('video-to-video', 3, processVideoGeneration);

    videoProcessingQueue.process('encode', 10, processVideoProcessing);
    videoProcessingQueue.process('enhance', 5, processVideoProcessing);
    videoProcessingQueue.process('composite', 8, processVideoProcessing);

    audioGenerationQueue.process('voice-synthesis', 10, processAudioGeneration);
    audioGenerationQueue.process('lip-sync', 5, processAudioGeneration);

    bulkOperationQueue.process('bulk-video-generation', 2, processBulkOperations);
    bulkOperationQueue.process('bulk-processing', 3, processBulkOperations);

    analyticsQueue.process('calculate-metrics', 5, processAnalyticsCalculation);
    analyticsQueue.process('generate-reports', 2, processAnalyticsCalculation);

    emailQueue.process('send-email', 15, processEmailNotifications);
    emailQueue.process('send-bulk-email', 5, processEmailNotifications);

    webhookQueue.process('deliver-webhook', 20, processWebhookDelivery);

    // Set up event listeners for all queues
    setupQueueEventListeners();

    logger.info('All job queues initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
    throw error;
  }
}

function setupQueueEventListeners(): void {
  const queues = [
    { name: 'video-generation', queue: videoGenerationQueue },
    { name: 'video-processing', queue: videoProcessingQueue },
    { name: 'audio-generation', queue: audioGenerationQueue },
    { name: 'bulk-operations', queue: bulkOperationQueue },
    { name: 'analytics', queue: analyticsQueue },
    { name: 'email', queue: emailQueue },
    { name: 'webhook', queue: webhookQueue },
  ];

  queues.forEach(({ name, queue }) => {
    // Job completed
    queue.on('completed', (job: Job) => {
      logger.info(`Job completed in queue ${name}:`, {
        jobId: job.id,
        jobType: job.name,
        duration: job.finishedOn ? job.finishedOn - job.processedOn! : 0,
      });
    });

    // Job failed
    queue.on('failed', (job: Job, err: Error) => {
      logger.error(`Job failed in queue ${name}:`, {
        jobId: job.id,
        jobType: job.name,
        error: err.message,
        attempts: job.attemptsMade,
      });
    });

    // Job stalled
    queue.on('stalled', (job: Job) => {
      logger.warn(`Job stalled in queue ${name}:`, {
        jobId: job.id,
        jobType: job.name,
      });
    });

    // Job progress
    queue.on('progress', (job: Job, progress: number) => {
      logger.debug(`Job progress in queue ${name}:`, {
        jobId: job.id,
        jobType: job.name,
        progress,
      });
    });
  });
}

// Queue management functions
export class QueueManager {
  static async addVideoGenerationJob(
    type: 'text-to-video' | 'image-to-video' | 'video-to-video',
    data: any,
    options?: Bull.JobOptions
  ): Promise<Job> {
    return videoGenerationQueue.add(type, data, {
      ...options,
      priority: options?.priority || 10, // High priority for video generation
    });
  }

  static async addVideoProcessingJob(
    type: 'encode' | 'enhance' | 'composite',
    data: any,
    options?: Bull.JobOptions
  ): Promise<Job> {
    return videoProcessingQueue.add(type, data, options);
  }

  static async addAudioGenerationJob(
    type: 'voice-synthesis' | 'lip-sync',
    data: any,
    options?: Bull.JobOptions
  ): Promise<Job> {
    return audioGenerationQueue.add(type, data, options);
  }

  static async addBulkOperationJob(
    type: 'bulk-video-generation' | 'bulk-processing',
    data: any,
    options?: Bull.JobOptions
  ): Promise<Job> {
    return bulkOperationQueue.add(type, data, {
      ...options,
      priority: -5, // Lower priority for bulk operations
    });
  }

  static async addAnalyticsJob(
    type: 'calculate-metrics' | 'generate-reports',
    data: any,
    options?: Bull.JobOptions
  ): Promise<Job> {
    return analyticsQueue.add(type, data, options);
  }

  static async addEmailJob(
    type: 'send-email' | 'send-bulk-email',
    data: any,
    options?: Bull.JobOptions
  ): Promise<Job> {
    return emailQueue.add(type, data, options);
  }

  static async addWebhookJob(
    data: any,
    options?: Bull.JobOptions
  ): Promise<Job> {
    return webhookQueue.add('deliver-webhook', data, {
      ...options,
      attempts: 5, // More attempts for webhooks
    });
  }

  // Job management
  static async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = getQueueByName(queueName);
    if (!queue) return null;
    
    return queue.getJob(jobId);
  }

  static async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = getQueueByName(queueName);
    if (!queue) return;
    
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  static async retryJob(queueName: string, jobId: string): Promise<void> {
    const queue = getQueueByName(queueName);
    if (!queue) return;
    
    const job = await queue.getJob(jobId);
    if (job) {
      await job.retry();
    }
  }

  static async getQueueStats(queueName: string) {
    const queue = getQueueByName(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  static async pauseQueue(queueName: string): Promise<void> {
    const queue = getQueueByName(queueName);
    if (queue) {
      await queue.pause();
    }
  }

  static async resumeQueue(queueName: string): Promise<void> {
    const queue = getQueueByName(queueName);
    if (queue) {
      await queue.resume();
    }
  }

  static async clearQueue(queueName: string): Promise<void> {
    const queue = getQueueByName(queueName);
    if (queue) {
      await queue.empty();
    }
  }
}

function getQueueByName(name: string): Queue | null {
  switch (name) {
    case 'video-generation':
      return videoGenerationQueue;
    case 'video-processing':
      return videoProcessingQueue;
    case 'audio-generation':
      return audioGenerationQueue;
    case 'bulk-operations':
      return bulkOperationQueue;
    case 'analytics':
      return analyticsQueue;
    case 'email':
      return emailQueue;
    case 'webhook':
      return webhookQueue;
    default:
      return null;
  }
}

// Cleanup function
export async function closeQueues(): Promise<void> {
  const queues = [
    videoGenerationQueue,
    videoProcessingQueue,
    audioGenerationQueue,
    bulkOperationQueue,
    analyticsQueue,
    emailQueue,
    webhookQueue,
  ];

  await Promise.all(queues.map(queue => queue?.close()));
  logger.info('All queues closed successfully');
}

// Health check
export async function checkQueuesHealth(): Promise<Record<string, boolean>> {
  const queueNames = [
    'video-generation',
    'video-processing',
    'audio-generation',
    'bulk-operations',
    'analytics',
    'email',
    'webhook',
  ];

  const health: Record<string, boolean> = {};

  for (const name of queueNames) {
    try {
      const queue = getQueueByName(name);
      if (queue) {
        await queue.getJobCounts();
        health[name] = true;
      } else {
        health[name] = false;
      }
    } catch (error) {
      logger.error(`Queue health check failed for ${name}:`, error);
      health[name] = false;
    }
  }

  return health;
}

// Export queue instances (for dashboard or other uses)
export {
  videoGenerationQueue,
  videoProcessingQueue,
  audioGenerationQueue,
  bulkOperationQueue,
  analyticsQueue,
  emailQueue,
  webhookQueue,
};