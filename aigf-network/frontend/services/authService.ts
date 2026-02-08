import type { 
  APIResponse, 
  User, 
  UserProgress, 
  LoginForm, 
  RegisterForm,
  ProfileForm
} from '@/types';
import { apiClient } from './apiClient';

interface LoginResponse {
  user: User;
  progress: UserProgress | null;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

interface RegisterResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

interface RefreshTokenResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

interface CurrentUserResponse {
  user: User;
  progress: UserProgress | null;
}

class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginForm): Promise<APIResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe || false
    });

    return response;
  }

  /**
   * Register new user account
   */
  async register(data: RegisterForm): Promise<APIResponse<RegisterResponse>> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      goals: data.goals || [],
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          desktop: false
        }
      }
    });

    return response;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<APIResponse<RefreshTokenResponse>> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken
    });

    return response;
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<APIResponse<CurrentUserResponse>> {
    const response = await apiClient.get<CurrentUserResponse>('/auth/me');
    return response;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<APIResponse> {
    const response = await apiClient.post('/auth/logout');
    return response;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<ProfileForm>): Promise<APIResponse<User>> {
    const response = await apiClient.patch<User>('/users/profile', updates);
    return response;
  }

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<APIResponse> {
    const response = await apiClient.post('/auth/change-password', data);
    return response;
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<APIResponse> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response;
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: {
    token: string;
    password: string;
  }): Promise<APIResponse> {
    const response = await apiClient.post('/auth/reset-password', data);
    return response;
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<APIResponse> {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response;
  }

  /**
   * Resend email verification
   */
  async resendVerification(): Promise<APIResponse> {
    const response = await apiClient.post('/auth/resend-verification');
    return response;
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      desktop?: boolean;
      sessionReminders?: boolean;
      achievementAlerts?: boolean;
      weeklyProgress?: boolean;
    };
    privacy?: {
      profileVisibility?: 'public' | 'friends' | 'private';
      shareProgress?: boolean;
      allowCommunityStories?: boolean;
      dataRetention?: 'full' | 'minimal' | 'anonymous';
    };
    preferences?: {
      theme?: 'light' | 'dark' | 'auto';
      language?: string;
      timezone?: string;
      autoplay?: boolean;
      soundEffects?: boolean;
      reducedMotion?: boolean;
    };
  }): Promise<APIResponse<User>> {
    const response = await apiClient.patch<User>('/users/settings', settings);
    return response;
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<APIResponse<{ profilePictureUrl: string }>> {
    const response = await apiClient.uploadFile<{ profilePictureUrl: string }>(
      '/users/profile-picture', 
      file, 
      onProgress
    );
    return response;
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<APIResponse> {
    const response = await apiClient.post('/auth/delete-account', { password });
    return response;
  }

  /**
   * Get user activity log
   */
  async getActivityLog(page = 1, limit = 20): Promise<APIResponse<{
    activities: Array<{
      id: string;
      action: string;
      details: string;
      timestamp: string;
      ipAddress?: string;
      userAgent?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const response = await apiClient.get('/users/activity-log', {
      params: { page, limit }
    });
    return response;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<APIResponse<{
    totalSessions: number;
    totalPracticeTime: number;
    averageConfidenceScore: number;
    streakDays: number;
    achievementsEarned: number;
    favoritePracticeScenarios: Array<{
      id: string;
      title: string;
      count: number;
    }>;
    weeklyProgress: Array<{
      week: string;
      sessionsCompleted: number;
      practiceTimeMinutes: number;
      confidenceImprovement: number;
    }>;
  }>> {
    const response = await apiClient.get('/users/stats');
    return response;
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportUserData(): Promise<boolean> {
    const success = await apiClient.downloadFile('/users/export-data', 'my-aigf-data.json');
    return success;
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username: string): Promise<APIResponse<{ available: boolean }>> {
    const response = await apiClient.get<{ available: boolean }>('/auth/check-username', {
      params: { username }
    });
    return response;
  }

  /**
   * Check email availability
   */
  async checkEmailAvailability(email: string): Promise<APIResponse<{ available: boolean }>> {
    const response = await apiClient.get<{ available: boolean }>('/auth/check-email', {
      params: { email }
    });
    return response;
  }

  /**
   * Get user preferences for onboarding
   */
  async getOnboardingPreferences(): Promise<APIResponse<{
    preferredPersonalities: string[];
    interestedScenarios: string[];
    confidenceLevel: 'low' | 'medium' | 'high';
    practiceGoals: string[];
    availableTime: 'light' | 'moderate' | 'intensive';
  }>> {
    const response = await apiClient.get('/users/onboarding-preferences');
    return response;
  }

  /**
   * Update onboarding preferences
   */
  async updateOnboardingPreferences(preferences: {
    preferredPersonalities?: string[];
    interestedScenarios?: string[];
    confidenceLevel?: 'low' | 'medium' | 'high';
    practiceGoals?: string[];
    availableTime?: 'light' | 'moderate' | 'intensive';
  }): Promise<APIResponse> {
    const response = await apiClient.post('/users/onboarding-preferences', preferences);
    return response;
  }

  /**
   * Get subscription information
   */
  async getSubscriptionInfo(): Promise<APIResponse<{
    subscriptionType: 'free' | 'premium' | 'enterprise';
    subscriptionStatus: 'active' | 'cancelled' | 'expired';
    subscriptionExpires?: string;
    features: {
      maxSessionsPerDay: number;
      maxSessionDuration: number;
      unlimitedPersonalities: boolean;
      advancedAnalytics: boolean;
      voiceChat: boolean;
      prioritySupport: boolean;
      communityFeatures: boolean;
    };
    usage: {
      sessionsToday: number;
      sessionsThisMonth: number;
      totalSessions: number;
    };
  }>> {
    const response = await apiClient.get('/users/subscription');
    return response;
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(plan: 'premium' | 'enterprise'): Promise<APIResponse<{
    checkoutUrl: string;
  }>> {
    const response = await apiClient.post<{ checkoutUrl: string }>('/users/upgrade-subscription', {
      plan
    });
    return response;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<APIResponse> {
    const response = await apiClient.post('/users/cancel-subscription');
    return response;
  }

  /**
   * Validate session token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/validate');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get mental health check status
   */
  async getMentalHealthStatus(): Promise<APIResponse<{
    status: 'green' | 'yellow' | 'orange' | 'red';
    lastCheck: string;
    recommendations: string[];
    resources: Array<{
      title: string;
      description: string;
      url?: string;
      contactInfo?: any;
      isEmergency: boolean;
    }>;
  }>> {
    const response = await apiClient.get('/users/mental-health-status');
    return response;
  }

  /**
   * Update mental health check
   */
  async updateMentalHealthCheck(data: {
    moodRating: number; // 1-10
    stressLevel: number; // 1-10
    sleepQuality: number; // 1-10
    socialConnection: number; // 1-10
    notes?: string;
  }): Promise<APIResponse> {
    const response = await apiClient.post('/users/mental-health-check', data);
    return response;
  }
}

// Export singleton instance
export const authService = new AuthService();