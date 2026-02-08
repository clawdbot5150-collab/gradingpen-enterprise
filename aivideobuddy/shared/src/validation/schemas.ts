import { z } from 'zod';
import { SubscriptionTier, VideoResolution, VideoStatus, JobType, TemplateCategory } from '../types';

// User validation schemas
export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid username format'),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  ),
  displayName: z.string().min(1).max(50),
});

export const UserUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Video validation schemas
export const VideoCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.object({
    includeWatermark: z.boolean().default(true),
    quality: z.enum(['low', 'medium', 'high', 'ultra']).default('medium'),
    outputFormat: z.enum(['mp4', 'webm', 'mov']).default('mp4'),
    compression: z.enum(['fast', 'balanced', 'quality']).default('balanced'),
  }).optional(),
});

export const VideoUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(VideoStatus).optional(),
  settings: z.object({
    includeWatermark: z.boolean().optional(),
    quality: z.enum(['low', 'medium', 'high', 'ultra']).optional(),
    outputFormat: z.enum(['mp4', 'webm', 'mov']).optional(),
    compression: z.enum(['fast', 'balanced', 'quality']).optional(),
  }).partial().optional(),
});

// AI Generation schemas
export const TextToVideoSchema = z.object({
  prompt: z.string().min(10).max(1000),
  duration: z.number().min(1).max(300),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3']),
  style: z.string().max(100).optional(),
  model: z.enum(['openai', 'runway', 'stable-video']),
  seed: z.number().int().min(0).max(2147483647).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
});

export const ImageToVideoSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().max(500).optional(),
  duration: z.number().min(1).max(30),
  motionStrength: z.number().min(0).max(1),
  model: z.enum(['runway', 'stable-video', 'pika']),
});

export const VideoToVideoSchema = z.object({
  inputVideoUrl: z.string().url(),
  prompt: z.string().min(10).max(1000),
  strength: z.number().min(0).max(1),
  preserveAudio: z.boolean().default(true),
  model: z.enum(['runway', 'stable-video']),
});

export const VoiceGenerationSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().min(1),
  model: z.enum(['elevenlabs', 'openai', 'azure']),
  language: z.string().length(2), // ISO language code
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
});

// Template schemas
export const TemplateCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.nativeEnum(TemplateCategory),
  tags: z.array(z.string().min(1).max(30)).max(10),
  isPremium: z.boolean().default(false),
  price: z.number().min(0).max(1000).optional(),
  config: z.object({
    scenes: z.array(z.object({
      id: z.string(),
      type: z.enum(['text', 'image', 'video', 'shape', 'audio']),
      duration: z.number().min(0),
      startTime: z.number().min(0),
      properties: z.record(z.any()),
      animations: z.array(z.object({
        id: z.string(),
        type: z.enum(['fadeIn', 'fadeOut', 'slideIn', 'slideOut', 'zoom', 'rotate', 'bounce']),
        startTime: z.number().min(0),
        duration: z.number().min(0),
        easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']),
        properties: z.record(z.any()),
      })),
    })),
    transitions: z.array(z.object({
      id: z.string(),
      type: z.enum(['fade', 'slide', 'zoom', 'rotate', 'wipe']),
      duration: z.number().min(0),
      properties: z.record(z.any()),
    })),
    defaultAssets: z.array(z.object({
      id: z.string(),
      type: z.enum(['image', 'video', 'audio', 'font']),
      url: z.string().url(),
      name: z.string(),
      metadata: z.record(z.any()),
    })),
    customizations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['text', 'color', 'image', 'logo', 'audio']),
      required: z.boolean(),
      defaultValue: z.any().optional(),
      constraints: z.record(z.any()).optional(),
    })),
  }),
});

export const TemplateUpdateSchema = TemplateCreateSchema.partial();

// Brand Kit schemas
export const BrandKitCreateSchema = z.object({
  name: z.string().min(1).max(50),
  logo: z.object({
    id: z.string(),
    type: z.literal('image'),
    url: z.string().url(),
    name: z.string(),
    metadata: z.record(z.any()),
  }).optional(),
  colors: z.array(z.object({
    name: z.string().min(1).max(30),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    usage: z.enum(['primary', 'secondary', 'accent', 'background', 'text']),
  })).max(10),
  fonts: z.array(z.object({
    name: z.string().min(1).max(50),
    family: z.string().min(1).max(100),
    weights: z.array(z.number().int().min(100).max(900)),
    url: z.string().url().optional(),
    usage: z.enum(['heading', 'body', 'accent']),
  })).max(5),
});

export const BrandKitUpdateSchema = BrandKitCreateSchema.partial();

// File upload schemas
export const FileUploadSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().min(1).max(2 * 1024 * 1024 * 1024), // 2GB max
});

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search schemas
export const SearchSchema = z.object({
  query: z.string().min(1).max(100),
  category: z.nativeEnum(TemplateCategory).optional(),
  tags: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  isPremium: z.boolean().optional(),
}).merge(PaginationSchema);

// Analytics schemas
export const AnalyticsQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  interval: z.enum(['1h', '1d', '1w', '1m']).default('1d'),
  metrics: z.array(z.enum(['views', 'completion_rate', 'engagement', 'conversion', 'retention'])),
  filters: z.record(z.any()).optional(),
});

// Webhook schemas
export const WebhookCreateSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(1).optional(),
  active: z.boolean().default(true),
});

export const WebhookUpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  secret: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

// API Key schemas
export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(50),
  permissions: z.array(z.string()).min(1),
  expiresAt: z.coerce.date().optional(),
});

// Subscription schemas
export const SubscriptionUpdateSchema = z.object({
  planId: z.string(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

// Team/Collaboration schemas
export const TeamInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  message: z.string().max(500).optional(),
});

export const TeamMemberUpdateSchema = z.object({
  role: z.enum(['viewer', 'editor', 'admin']),
});

// Project schemas
export const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  templateId: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const ProjectUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

// Bulk operation schemas
export const BulkVideoCreateSchema = z.object({
  videos: z.array(TextToVideoSchema).min(1).max(100),
  settings: z.object({
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    notifyOnComplete: z.boolean().default(true),
    outputFormat: z.enum(['mp4', 'webm', 'mov']).default('mp4'),
  }).optional(),
});

// Export all schemas
export const ValidationSchemas = {
  // User
  UserCreate: UserCreateSchema,
  UserUpdate: UserUpdateSchema,
  Login: LoginSchema,
  
  // Video
  VideoCreate: VideoCreateSchema,
  VideoUpdate: VideoUpdateSchema,
  
  // AI Generation
  TextToVideo: TextToVideoSchema,
  ImageToVideo: ImageToVideoSchema,
  VideoToVideo: VideoToVideoSchema,
  VoiceGeneration: VoiceGenerationSchema,
  
  // Template
  TemplateCreate: TemplateCreateSchema,
  TemplateUpdate: TemplateUpdateSchema,
  
  // Brand Kit
  BrandKitCreate: BrandKitCreateSchema,
  BrandKitUpdate: BrandKitUpdateSchema,
  
  // Utilities
  FileUpload: FileUploadSchema,
  Pagination: PaginationSchema,
  Search: SearchSchema,
  AnalyticsQuery: AnalyticsQuerySchema,
  
  // Integrations
  WebhookCreate: WebhookCreateSchema,
  WebhookUpdate: WebhookUpdateSchema,
  ApiKeyCreate: ApiKeyCreateSchema,
  
  // Subscription
  SubscriptionUpdate: SubscriptionUpdateSchema,
  
  // Team
  TeamInvite: TeamInviteSchema,
  TeamMemberUpdate: TeamMemberUpdateSchema,
  
  // Project
  ProjectCreate: ProjectCreateSchema,
  ProjectUpdate: ProjectUpdateSchema,
  
  // Bulk
  BulkVideoCreate: BulkVideoCreateSchema,
} as const;

// Type helpers
export type ValidationSchema = typeof ValidationSchemas;
export type SchemaKey = keyof ValidationSchema;
export type InferSchema<T extends SchemaKey> = z.infer<ValidationSchema[T]>;