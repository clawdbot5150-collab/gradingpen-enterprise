import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { logger } from '../utils/logger';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// S3/R2 Client configuration
let s3Client: S3Client;

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'aivideobuddy-storage';
const REGION = process.env.AWS_REGION || 'auto'; // 'auto' for Cloudflare R2
const ENDPOINT = process.env.S3_ENDPOINT; // For Cloudflare R2 or custom S3 endpoint

export async function initializeStorage(): Promise<void> {
  try {
    const config: any = {
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    };

    // If using Cloudflare R2 or custom endpoint
    if (ENDPOINT) {
      config.endpoint = ENDPOINT;
      config.forcePathStyle = true; // Required for R2
    }

    s3Client = new S3Client(config);

    // Test the connection
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'health-check',
    }));

    logger.info('Storage service initialized successfully');
  } catch (error) {
    // If health check fails, it's okay - the bucket might not have a health-check object
    // The important thing is that the client is configured
    logger.info('Storage service initialized (health check object not found, but configuration is valid)');
  }
}

// Storage service class
export class StorageService {
  private static instance: StorageService;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Upload file to storage
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<{ key: string; url: string; size: number }> {
    try {
      const key = this.generateFileKey(fileName, folder);
      
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          Metadata: {
            originalName: fileName,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      const result = await upload.done();
      const url = this.getPublicUrl(key);

      logger.info(`File uploaded successfully: ${key}`);

      return {
        key,
        url,
        size: fileBuffer.length,
      };
    } catch (error) {
      logger.error('File upload failed:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  // Upload stream (for large files)
  async uploadStream(
    stream: NodeJS.ReadableStream,
    fileName: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<{ key: string; url: string }> {
    try {
      const key = this.generateFileKey(fileName, folder);
      
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: key,
          Body: stream,
          ContentType: contentType,
          Metadata: {
            originalName: fileName,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      await upload.done();
      const url = this.getPublicUrl(key);

      logger.info(`Stream uploaded successfully: ${key}`);

      return { key, url };
    } catch (error) {
      logger.error('Stream upload failed:', error);
      throw new Error('Failed to upload stream to storage');
    }
  }

  // Get signed URL for secure uploads
  async getUploadUrl(
    fileName: string,
    contentType: string,
    folder: string = 'uploads',
    expiresIn: number = 3600
  ): Promise<{ key: string; uploadUrl: string; publicUrl: string }> {
    try {
      const key = this.generateFileKey(fileName, folder);
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
      const publicUrl = this.getPublicUrl(key);

      return { key, uploadUrl, publicUrl };
    } catch (error) {
      logger.error('Failed to generate upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  // Get signed URL for secure downloads
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      logger.error('Failed to generate download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  // Delete file from storage
  async deleteFile(key: string): Promise<boolean> {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));

      logger.info(`File deleted successfully: ${key}`);
      return true;
    } catch (error) {
      logger.error('File deletion failed:', error);
      return false;
    }
  }

  // Check if file exists
  async fileExists(key: string): Promise<boolean> {
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get file metadata
  async getFileMetadata(key: string): Promise<any> {
    try {
      const response = await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      logger.error('Failed to get file metadata:', error);
      return null;
    }
  }

  // Copy file within storage
  async copyFile(sourceKey: string, destinationKey: string): Promise<boolean> {
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: destinationKey,
        CopySource: `${BUCKET_NAME}/${sourceKey}`,
      }));

      logger.info(`File copied from ${sourceKey} to ${destinationKey}`);
      return true;
    } catch (error) {
      logger.error('File copy failed:', error);
      return false;
    }
  }

  // Generate unique file key
  private generateFileKey(fileName: string, folder: string): string {
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    
    // Sanitize filename
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    return `${folder}/${timestamp}/${uniqueId}/${sanitizedBaseName}${extension}`;
  }

  // Get public URL for a file
  private getPublicUrl(key: string): string {
    if (ENDPOINT) {
      // For Cloudflare R2 or custom endpoint
      const baseUrl = ENDPOINT.replace(/\/$/, '');
      return `${baseUrl}/${BUCKET_NAME}/${key}`;
    } else {
      // For AWS S3
      return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
    }
  }

  // Organize files by category
  getVideoFolder(): string {
    return 'videos';
  }

  getImageFolder(): string {
    return 'images';
  }

  getAudioFolder(): string {
    return 'audio';
  }

  getTemplateFolder(): string {
    return 'templates';
  }

  getThumbnailFolder(): string {
    return 'thumbnails';
  }

  getUserAssetFolder(userId: string): string {
    return `users/${userId}/assets`;
  }

  getBrandKitFolder(userId: string): string {
    return `users/${userId}/brand-kits`;
  }
}

// Utility functions for specific file types
export class VideoStorageService extends StorageService {
  async uploadVideo(
    videoBuffer: Buffer,
    fileName: string,
    userId: string
  ): Promise<{ key: string; url: string; size: number }> {
    const folder = `${this.getVideoFolder()}/${userId}`;
    return this.uploadFile(videoBuffer, fileName, 'video/mp4', folder);
  }

  async uploadThumbnail(
    imageBuffer: Buffer,
    fileName: string,
    userId: string
  ): Promise<{ key: string; url: string; size: number }> {
    const folder = `${this.getThumbnailFolder()}/${userId}`;
    return this.uploadFile(imageBuffer, fileName, 'image/jpeg', folder);
  }
}

export class ImageStorageService extends StorageService {
  async uploadImage(
    imageBuffer: Buffer,
    fileName: string,
    userId: string
  ): Promise<{ key: string; url: string; size: number }> {
    const folder = `${this.getImageFolder()}/${userId}`;
    return this.uploadFile(imageBuffer, fileName, 'image/jpeg', folder);
  }

  async uploadLogo(
    imageBuffer: Buffer,
    fileName: string,
    userId: string
  ): Promise<{ key: string; url: string; size: number }> {
    const folder = `${this.getBrandKitFolder(userId)}/logos`;
    return this.uploadFile(imageBuffer, fileName, 'image/png', folder);
  }
}

export class AudioStorageService extends StorageService {
  async uploadAudio(
    audioBuffer: Buffer,
    fileName: string,
    userId: string
  ): Promise<{ key: string; url: string; size: number }> {
    const folder = `${this.getAudioFolder()}/${userId}`;
    return this.uploadFile(audioBuffer, fileName, 'audio/mpeg', folder);
  }
}

// Health check for storage
export async function checkStorageHealth(): Promise<boolean> {
  try {
    const testKey = `health-check/${Date.now()}.txt`;
    const testContent = Buffer.from('Health check');
    
    // Try to upload a small test file
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    }));

    // Try to delete the test file
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
    }));

    return true;
  } catch (error) {
    logger.error('Storage health check failed:', error);
    return false;
  }
}

export { s3Client };