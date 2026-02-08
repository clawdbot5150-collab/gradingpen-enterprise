import { Job } from 'bull';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import axios from 'axios';
import crypto from 'crypto';

export async function processWebhookDelivery(job: Job): Promise<void> {
  const { webhookId, eventType, payload } = job.data;

  try {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || !webhook.active) {
      logger.warn(`Webhook ${webhookId} not found or inactive`);
      return;
    }

    const deliveryPayload = {
      event: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
      webhook_id: webhookId,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AIVideoBuddy-Webhooks/1.0',
    };

    // Add signature if secret is configured
    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(deliveryPayload))
        .digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const response = await axios.post(webhook.url, deliveryPayload, {
      headers,
      timeout: 30000,
    });

    // Record successful delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        eventType,
        payload: deliveryPayload,
        responseCode: response.status,
        responseBody: JSON.stringify(response.data).substring(0, 1000),
        deliveredAt: new Date(),
        status: 'delivered',
      },
    });

    logger.info(`Webhook delivered successfully to ${webhook.url}`);

  } catch (error) {
    logger.error('Webhook delivery failed:', error);

    // Record failed delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        eventType,
        payload: job.data.payload,
        responseCode: error.response?.status || 0,
        responseBody: error.message.substring(0, 1000),
        status: 'failed',
        retryCount: job.attemptsMade,
        nextRetryAt: new Date(Date.now() + Math.pow(2, job.attemptsMade) * 1000),
      },
    });

    throw error;
  }
}