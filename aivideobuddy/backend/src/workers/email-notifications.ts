import { Job } from 'bull';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';

const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function processEmailNotifications(job: Job): Promise<void> {
  const { type } = job.data;

  switch (type) {
    case 'send-email':
      return sendSingleEmail(job);
    case 'send-bulk-email':
      return sendBulkEmail(job);
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

async function sendSingleEmail(job: Job): Promise<void> {
  const { to, subject, html, template, data } = job.data;

  try {
    let emailContent = html;
    
    if (template) {
      emailContent = generateEmailFromTemplate(template, data);
    }

    await emailTransporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html: emailContent,
    });

    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
}

async function sendBulkEmail(job: Job): Promise<void> {
  const { recipients, subject, template, data } = job.data;

  try {
    for (const recipient of recipients) {
      const personalizedData = { ...data, ...recipient };
      const emailContent = generateEmailFromTemplate(template, personalizedData);

      await emailTransporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: recipient.email,
        subject: subject.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => 
          personalizedData[key] || match
        ),
        html: emailContent,
      });

      job.progress(Math.round(((recipients.indexOf(recipient) + 1) / recipients.length) * 100));
    }

    logger.info(`Bulk email sent to ${recipients.length} recipients`);
  } catch (error) {
    logger.error('Bulk email sending failed:', error);
    throw error;
  }
}

function generateEmailFromTemplate(template: string, data: any): string {
  // Simple template replacement
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
}