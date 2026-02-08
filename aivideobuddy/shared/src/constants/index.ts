import { SubscriptionTier, VideoResolution, PlanLimits } from '../types';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 1000,
  },
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_VIDEO_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  MAX_IMAGE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_AUDIO_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_VIDEO_FORMATS: ['mp4', 'mov', 'avi', 'webm'],
  ALLOWED_AUDIO_FORMATS: ['mp3', 'wav', 'aac', 'm4a'],
} as const;

// Video Generation Limits
export const VIDEO_LIMITS = {
  MAX_DURATION: {
    [SubscriptionTier.FREE]: 30, // seconds
    [SubscriptionTier.PRO]: 300, // 5 minutes
    [SubscriptionTier.BUSINESS]: 1800, // 30 minutes
    [SubscriptionTier.ENTERPRISE]: 3600, // 1 hour
  },
  MAX_RESOLUTION: {
    [SubscriptionTier.FREE]: VideoResolution.SD_480P,
    [SubscriptionTier.PRO]: VideoResolution.FHD_1080P,
    [SubscriptionTier.BUSINESS]: VideoResolution.UHD_4K,
    [SubscriptionTier.ENTERPRISE]: VideoResolution.UHD_4K,
  },
  CREDITS_PER_SECOND: {
    [VideoResolution.SD_480P]: 1,
    [VideoResolution.HD_720P]: 2,
    [VideoResolution.FHD_1080P]: 3,
    [VideoResolution.UHD_4K]: 5,
  },
} as const;

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    price: 0,
    interval: 'month',
    limits: {
      videosPerMonth: 5,
      maxDuration: 30,
      maxResolution: VideoResolution.SD_480P,
      storageGB: 1,
      apiCallsPerMonth: 100,
      collaborators: 0,
      brandKits: 1,
      customTemplates: 0,
    } as PlanLimits,
    features: [
      'Watermarked videos',
      'Basic templates',
      'Standard AI models',
      'Community support',
    ],
  },
  [SubscriptionTier.PRO]: {
    name: 'Pro',
    price: 29,
    interval: 'month',
    limits: {
      videosPerMonth: 100,
      maxDuration: 300,
      maxResolution: VideoResolution.FHD_1080P,
      storageGB: 50,
      apiCallsPerMonth: 5000,
      collaborators: 3,
      brandKits: 5,
      customTemplates: 10,
    } as PlanLimits,
    features: [
      'No watermarks',
      'HD exports',
      'Premium templates',
      'Advanced AI models',
      'Priority processing',
      'Email support',
    ],
  },
  [SubscriptionTier.BUSINESS]: {
    name: 'Business',
    price: 99,
    interval: 'month',
    limits: {
      videosPerMonth: 500,
      maxDuration: 1800,
      maxResolution: VideoResolution.UHD_4K,
      storageGB: 200,
      apiCallsPerMonth: 25000,
      collaborators: 10,
      brandKits: 20,
      customTemplates: 100,
    } as PlanLimits,
    features: [
      '4K exports',
      'API access',
      'Team collaboration',
      'Custom templates',
      'Analytics dashboard',
      'White-label options',
      'Phone support',
    ],
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: 'Enterprise',
    price: 299,
    interval: 'month',
    limits: {
      videosPerMonth: -1, // unlimited
      maxDuration: 3600,
      maxResolution: VideoResolution.UHD_4K,
      storageGB: 1000,
      apiCallsPerMonth: 100000,
      collaborators: -1, // unlimited
      brandKits: -1, // unlimited
      customTemplates: -1, // unlimited
    } as PlanLimits,
    features: [
      'Unlimited videos',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Custom AI models',
      'On-premise deployment',
      'Advanced security',
    ],
  },
} as const;

// AI Model Configuration
export const AI_MODELS = {
  TEXT_TO_VIDEO: {
    openai: {
      name: 'OpenAI Sora',
      maxDuration: 60,
      aspectRatios: ['16:9', '9:16', '1:1'],
      costPerSecond: 0.5,
    },
    runway: {
      name: 'Runway Gen-3',
      maxDuration: 30,
      aspectRatios: ['16:9', '9:16', '1:1', '4:3'],
      costPerSecond: 0.3,
    },
    'stable-video': {
      name: 'Stable Video Diffusion',
      maxDuration: 25,
      aspectRatios: ['16:9', '1:1'],
      costPerSecond: 0.2,
    },
  },
  IMAGE_TO_VIDEO: {
    runway: {
      name: 'Runway Gen-3 Image',
      maxDuration: 10,
      costPerSecond: 0.4,
    },
    'stable-video': {
      name: 'SVD Image',
      maxDuration: 4,
      costPerSecond: 0.15,
    },
    pika: {
      name: 'Pika Labs',
      maxDuration: 8,
      costPerSecond: 0.25,
    },
  },
  VOICE_GENERATION: {
    elevenlabs: {
      name: 'ElevenLabs',
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
      costPerCharacter: 0.001,
    },
    openai: {
      name: 'OpenAI TTS',
      voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
      costPerCharacter: 0.0005,
    },
    azure: {
      name: 'Azure Speech',
      languages: 75,
      costPerCharacter: 0.0003,
    },
  },
} as const;

// Template Categories
export const TEMPLATE_CATEGORIES = [
  { id: 'social-media', name: 'Social Media', icon: '📱' },
  { id: 'advertising', name: 'Advertising', icon: '📢' },
  { id: 'explainer', name: 'Explainer', icon: '💡' },
  { id: 'tutorial', name: 'Tutorial', icon: '🎓' },
  { id: 'presentation', name: 'Presentation', icon: '📊' },
  { id: 'logo-reveal', name: 'Logo Reveal', icon: '🎯' },
  { id: 'slideshow', name: 'Slideshow', icon: '🖼️' },
  { id: 'animation', name: 'Animation', icon: '✨' },
  { id: 'music-video', name: 'Music Video', icon: '🎵' },
  { id: 'news', name: 'News', icon: '📰' },
] as const;

// Video Aspect Ratios
export const ASPECT_RATIOS = [
  { value: '16:9', label: 'Landscape (16:9)', width: 1920, height: 1080 },
  { value: '9:16', label: 'Portrait (9:16)', width: 1080, height: 1920 },
  { value: '1:1', label: 'Square (1:1)', width: 1080, height: 1080 },
  { value: '4:3', label: 'Standard (4:3)', width: 1440, height: 1080 },
  { value: '21:9', label: 'Ultrawide (21:9)', width: 2560, height: 1080 },
] as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  
  // Processing
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  AI_MODEL_ERROR: 'AI_MODEL_ERROR',
  VIDEO_GENERATION_FAILED: 'VIDEO_GENERATION_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  EMAIL_DELIVERY_FAILED: 'EMAIL_DELIVERY_FAILED',
  
  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Events for real-time updates
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  
  // Video Processing
  VIDEO_PROCESSING_STARTED: 'video-processing-started',
  VIDEO_PROCESSING_PROGRESS: 'video-processing-progress',
  VIDEO_PROCESSING_COMPLETED: 'video-processing-completed',
  VIDEO_PROCESSING_FAILED: 'video-processing-failed',
  
  // Collaboration
  USER_JOINED_PROJECT: 'user-joined-project',
  USER_LEFT_PROJECT: 'user-left-project',
  PROJECT_UPDATED: 'project-updated',
  CURSOR_POSITION: 'cursor-position',
  
  // Notifications
  NOTIFICATION: 'notification',
  CREDITS_LOW: 'credits-low',
  SUBSCRIPTION_EXPIRED: 'subscription-expired',
} as const;

// Content Moderation
export const MODERATION_CONFIG = {
  ENABLED: true,
  CONFIDENCE_THRESHOLD: 0.8,
  CATEGORIES: [
    'explicit',
    'suggestive',
    'violence',
    'harassment',
    'hate-speech',
    'spam',
    'copyright',
  ],
  AUTO_REJECT_THRESHOLD: 0.9,
  HUMAN_REVIEW_THRESHOLD: 0.6,
} as const;

// Analytics
export const ANALYTICS_CONFIG = {
  RETENTION_DAYS: 365,
  AGGREGATION_INTERVALS: ['1h', '1d', '1w', '1m'],
  METRICS: [
    'views',
    'completion_rate',
    'engagement',
    'conversion',
    'retention',
  ],
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  BETA_FEATURES: process.env.NODE_ENV === 'development',
  AI_VOICE_CLONING: false,
  REAL_TIME_COLLABORATION: true,
  BULK_PROCESSING: true,
  WHITE_LABEL: true,
  API_ACCESS: true,
  TEMPLATE_MARKETPLACE: true,
  ANALYTICS_DASHBOARD: true,
} as const;