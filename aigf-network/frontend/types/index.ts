// Core Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  subscriptionType: 'free' | 'premium' | 'enterprise';
  emailVerified: boolean;
  profilePicture?: string;
  bio?: string;
  goals: string[];
  timezone: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  overallConfidenceScore: number;
  categoryScores: Record<string, number>;
  personalityCompatibility: Record<string, number>;
  skillAssessments: Record<string, number>;
  strengths: string[];
  improvementAreas: string[];
  milestonesAchieved: number;
  totalPracticeTimeMinutes: number;
  sessionsCompleted: number;
  currentLevel: number;
  experiencePoints: number;
  streakDays: number;
  longestStreak: number;
  lastActivity: string;
  updatedAt: string;
}

// AI Personalities
export type PersonalityType = 
  | 'confident' 
  | 'empathetic' 
  | 'playful' 
  | 'professional' 
  | 'intellectual' 
  | 'creative' 
  | 'supportive' 
  | 'challenging';

export interface AIPersonality {
  id: string;
  name: string;
  type: PersonalityType;
  description: string;
  personalityTraits: Record<string, any>;
  conversationStyle: Record<string, any>;
  difficultyAdaptation: Record<string, any>;
  voiceSettings?: Record<string, any>;
  avatarUrl?: string;
  isActive: boolean;
}

// Practice Scenarios
export type ScenarioCategory = 
  | 'first_date' 
  | 'social_events' 
  | 'workplace' 
  | 'cold_approach' 
  | 'group_conversations' 
  | 'networking';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface PracticeScenario {
  id: string;
  title: string;
  category: ScenarioCategory;
  difficulty: DifficultyLevel;
  description: string;
  objectives: string[];
  context: Record<string, any>;
  setupPrompt: string;
  successCriteria: Record<string, any>;
  timeLimitMinutes?: number;
  prerequisiteScenarios: string[];
  tags: string[];
  isActive: boolean;
}

// Chat Sessions
export type SessionType = 'practice' | 'free_chat' | 'assessment' | 'challenge';
export type MessageType = 'user' | 'ai' | 'system';

export interface ChatSession {
  id: string;
  userId: string;
  aiPersonalityId: string;
  practiceScenarioId?: string;
  sessionType: SessionType;
  title: string;
  difficultyLevel?: DifficultyLevel;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  messageCount: number;
  userSatisfactionRating?: number;
  aiDifficultyAdjustment: Record<string, any>;
  sessionMetadata: Record<string, any>;
  isCompleted: boolean;
  completionPercentage: number;
  
  // Populated fields
  aiPersonality?: AIPersonality;
  practiceScenario?: PracticeScenario;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  messageType: MessageType;
  content: string;
  senderId?: string;
  aiPersonalityId?: string;
  timestamp: string;
  messageMetadata: Record<string, any>;
  responseTimeMs?: number;
  confidenceScore?: number;
  sentimentScore?: number;
  engagementScore?: number;
  isEdited?: boolean;
  editedAt?: string;
  
  // Populated fields
  sender?: {
    id: string;
    username: string;
    name?: string;
  };
  aiPersonality?: {
    id: string;
    name: string;
    type: PersonalityType;
  };
}

// Analytics and Progress
export interface SessionAnalytics {
  id: string;
  sessionId: string;
  userId: string;
  analysisData: Record<string, any>;
  confidenceMetrics: {
    overallGrowth: number;
    qualityScores: Record<string, number>;
  };
  conversationQuality: Record<string, number>;
  improvementSuggestions: string[];
  strengthsIdentified: string[];
  areasToWorkOn: string[];
  aiPerformanceMetrics: Record<string, any>;
  generatedAt: string;
}

export interface ConversationAnalysis {
  overallConfidenceGrowth: number;
  conversationQuality: {
    clarity: number;
    engagement: number;
    authenticity: number;
    empathy: number;
  };
  strengthsIdentified: string[];
  improvementAreas: string[];
  specificFeedback: string;
  actionableAdvice: string[];
  confidenceBoostingSuggestions: string[];
  nextSteps: string;
}

// Badges and Achievements
export type BadgeType = 'achievement' | 'milestone' | 'special';

export interface Badge {
  id: string;
  name: string;
  description: string;
  badgeType: BadgeType;
  iconUrl?: string;
  requirements: Record<string, any>;
  pointsReward: number;
  rarityLevel: number;
  isActive: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  sessionId?: string;
  progressSnapshot?: Record<string, any>;
  
  // Populated fields
  badge: Badge;
}

// Challenges
export type ChallengeType = 'daily' | 'weekly' | 'special_event';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challengeType: ChallengeType;
  difficulty: DifficultyLevel;
  requirements: Record<string, any>;
  rewards: Record<string, any>;
  startDate: string;
  endDate: string;
  isActive: boolean;
  participationCount: number;
  completionCount: number;
}

export interface UserChallengeProgress {
  id: string;
  userId: string;
  challengeId: string;
  startedAt: string;
  completedAt?: string;
  progressData: Record<string, any>;
  isCompleted: boolean;
  pointsEarned: number;
  
  // Populated fields
  challenge: Challenge;
}

// Community
export interface CommunityStory {
  id: string;
  title: string;
  content: string;
  category?: ScenarioCategory;
  confidenceImprovementRating?: number;
  practiceDurationWeeks?: number;
  isApproved: boolean;
  isFeatured: boolean;
  upvotes: number;
  submittedAt: string;
  approvedAt?: string;
  featuredAt?: string;
}

// Mental Health
export interface MentalHealthResource {
  id: string;
  title: string;
  description: string;
  resourceType: 'article' | 'video' | 'hotline' | 'professional';
  content?: string;
  url?: string;
  contactInfo?: Record<string, any>;
  countryCodes: string[];
  languageCodes: string[];
  tags: string[];
  isEmergency: boolean;
  isActive: boolean;
}

export type MentalHealthStatus = 'green' | 'yellow' | 'orange' | 'red';

// API Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Socket Events
export interface SocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface TypingIndicator {
  userId: string;
  username?: string;
  typing: boolean;
}

export interface UserStatus {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorMessage?: string;
  errorCode?: string;
}

export interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  goals?: string[];
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface ProfileForm {
  firstName?: string;
  lastName?: string;
  username: string;
  bio?: string;
  goals: string[];
  timezone: string;
  profilePicture?: File;
}

// Settings Types
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    sessionReminders: boolean;
    achievementAlerts: boolean;
    weeklyProgress: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    shareProgress: boolean;
    allowCommunityStories: boolean;
    dataRetention: 'full' | 'minimal' | 'anonymous';
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    autoplay: boolean;
    soundEffects: boolean;
    reducedMotion: boolean;
  };
}

// Voice and Audio Types
export interface VoiceSettings {
  enabled: boolean;
  preferredVoice?: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface AudioAnalysis {
  confidence: number;
  clarity: number;
  pace: number;
  volume: number;
  emotionalTone: string;
  suggestions: string[];
}

// Export utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;