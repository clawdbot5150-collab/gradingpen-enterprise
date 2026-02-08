// User types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  subscription: SubscriptionTier;
  credits: number;
  brandKit?: BrandKit;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise'
}

// Video types
export interface Video {
  id: string;
  userId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  resolution: VideoResolution;
  status: VideoStatus;
  metadata: VideoMetadata;
  settings: VideoSettings;
  createdAt: Date;
  updatedAt: Date;
}

export enum VideoStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum VideoResolution {
  SD_480P = '480p',
  HD_720P = '720p',
  FHD_1080P = '1080p',
  UHD_4K = '4k'
}

export interface VideoMetadata {
  format: string;
  codec: string;
  bitrate: number;
  frameRate: number;
  audioCodec?: string;
  audioBitrate?: number;
  fileSize: number;
}

export interface VideoSettings {
  includeWatermark: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  outputFormat: 'mp4' | 'webm' | 'mov';
  compression: 'fast' | 'balanced' | 'quality';
}

// AI Generation types
export interface TextToVideoRequest {
  prompt: string;
  duration: number; // seconds
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  style?: string;
  model: 'openai' | 'runway' | 'stable-video';
  seed?: number;
  guidanceScale?: number;
}

export interface ImageToVideoRequest {
  imageUrl: string;
  prompt?: string;
  duration: number;
  motionStrength: number; // 0-1
  model: 'runway' | 'stable-video' | 'pika';
}

export interface VideoToVideoRequest {
  inputVideoUrl: string;
  prompt: string;
  strength: number; // 0-1
  preserveAudio: boolean;
  model: 'runway' | 'stable-video';
}

export interface VoiceGenerationRequest {
  text: string;
  voiceId: string;
  model: 'elevenlabs' | 'openai' | 'azure';
  language: string;
  stability?: number;
  similarityBoost?: number;
}

// Template types
export interface Template {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  previewUrl?: string;
  duration: number;
  aspectRatio: string;
  tags: string[];
  isPremium: boolean;
  price?: number;
  authorId: string;
  usageCount: number;
  rating: number;
  config: TemplateConfig;
  createdAt: Date;
  updatedAt: Date;
}

export enum TemplateCategory {
  SOCIAL_MEDIA = 'social-media',
  ADVERTISING = 'advertising',
  EXPLAINER = 'explainer',
  TUTORIAL = 'tutorial',
  PRESENTATION = 'presentation',
  LOGO_REVEAL = 'logo-reveal',
  SLIDESHOW = 'slideshow',
  ANIMATION = 'animation',
  MUSIC_VIDEO = 'music-video',
  NEWS = 'news'
}

export interface TemplateConfig {
  scenes: Scene[];
  transitions: Transition[];
  defaultAssets: Asset[];
  customizations: Customization[];
}

export interface Scene {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'audio';
  duration: number;
  startTime: number;
  properties: Record<string, any>;
  animations: Animation[];
}

export interface Transition {
  id: string;
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'wipe';
  duration: number;
  properties: Record<string, any>;
}

export interface Asset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'font';
  url: string;
  name: string;
  metadata: Record<string, any>;
}

export interface Animation {
  id: string;
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'zoom' | 'rotate' | 'bounce';
  startTime: number;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  properties: Record<string, any>;
}

export interface Customization {
  id: string;
  name: string;
  type: 'text' | 'color' | 'image' | 'logo' | 'audio';
  required: boolean;
  defaultValue?: any;
  constraints?: Record<string, any>;
}

// Brand Kit types
export interface BrandKit {
  id: string;
  userId: string;
  name: string;
  logo?: Asset;
  colors: BrandColor[];
  fonts: BrandFont[];
  templates: string[]; // template IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandColor {
  name: string;
  hex: string;
  usage: 'primary' | 'secondary' | 'accent' | 'background' | 'text';
}

export interface BrandFont {
  name: string;
  family: string;
  weights: number[];
  url?: string;
  usage: 'heading' | 'body' | 'accent';
}

// Analytics types
export interface VideoAnalytics {
  videoId: string;
  views: number;
  completionRate: number;
  averageWatchTime: number;
  engagement: EngagementMetrics;
  traffic: TrafficSource[];
  demographics: DemographicData;
  performance: PerformanceMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngagementMetrics {
  likes: number;
  shares: number;
  comments: number;
  downloads: number;
  clickThroughRate: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  campaign?: string;
  clicks: number;
  conversions: number;
}

export interface DemographicData {
  ageGroups: Record<string, number>;
  genders: Record<string, number>;
  countries: Record<string, number>;
  devices: Record<string, number>;
}

export interface PerformanceMetrics {
  loadTime: number;
  buffering: number;
  errorRate: number;
  qualityScore: number;
}

// Job Queue types
export interface JobData {
  id: string;
  type: JobType;
  userId: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: Record<string, any>;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export enum JobType {
  VIDEO_GENERATION = 'video-generation',
  VIDEO_PROCESSING = 'video-processing',
  AUDIO_GENERATION = 'audio-generation',
  IMAGE_GENERATION = 'image-generation',
  TEMPLATE_RENDER = 'template-render',
  BULK_PROCESSING = 'bulk-processing',
  ANALYTICS_CALCULATION = 'analytics-calculation',
  EMAIL_NOTIFICATION = 'email-notification',
  WEBHOOK_DELIVERY = 'webhook-delivery'
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  signature?: string;
}

// Real-time types
export interface SocketEvent {
  type: string;
  data: Record<string, any>;
  userId?: string;
  roomId?: string;
}

// File upload types
export interface FileUpload {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// Payment types
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  metadata: Record<string, any>;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  price: number;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
  isPopular: boolean;
  isActive: boolean;
}

export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface PlanLimits {
  videosPerMonth: number;
  maxDuration: number; // seconds
  maxResolution: VideoResolution;
  storageGB: number;
  apiCallsPerMonth: number;
  collaborators: number;
  brandKits: number;
  customTemplates: number;
}

// Content moderation types
export interface ModerationResult {
  approved: boolean;
  confidence: number;
  categories: ModerationCategory[];
  flags: string[];
  reviewRequired: boolean;
}

export interface ModerationCategory {
  name: string;
  score: number;
  threshold: number;
}