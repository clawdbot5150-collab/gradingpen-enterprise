import { SubscriptionTier, VideoResolution } from '../types';
import { SUBSCRIPTION_PLANS, VIDEO_LIMITS } from '../constants';

// String utilities
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length).replace(/\s+\S*$/, '') + '...';
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// Time utilities
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// Video utilities
export const calculateVideoCost = (
  duration: number,
  resolution: VideoResolution,
  tier: SubscriptionTier
): number => {
  const baseCredits = VIDEO_LIMITS.CREDITS_PER_SECOND[resolution] * duration;
  const multiplier = tier === SubscriptionTier.FREE ? 1.5 : 1;
  return Math.ceil(baseCredits * multiplier);
};

export const canCreateVideo = (
  duration: number,
  resolution: VideoResolution,
  tier: SubscriptionTier
): boolean => {
  const maxDuration = VIDEO_LIMITS.MAX_DURATION[tier];
  const maxResolution = VIDEO_LIMITS.MAX_RESOLUTION[tier];
  
  if (duration > maxDuration) return false;
  
  const resolutionHierarchy = {
    [VideoResolution.SD_480P]: 1,
    [VideoResolution.HD_720P]: 2,
    [VideoResolution.FHD_1080P]: 3,
    [VideoResolution.UHD_4K]: 4,
  };
  
  return resolutionHierarchy[resolution] <= resolutionHierarchy[maxResolution];
};

export const getOptimalResolution = (
  tier: SubscriptionTier,
  aspectRatio: string
): VideoResolution => {
  const maxResolution = VIDEO_LIMITS.MAX_RESOLUTION[tier];
  
  // For vertical videos, prefer lower resolutions for better performance
  if (aspectRatio === '9:16' && maxResolution === VideoResolution.UHD_4K) {
    return VideoResolution.FHD_1080P;
  }
  
  return maxResolution;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
};

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

// Object utilities
export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

export const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
};

// URL utilities
export const buildUrl = (base: string, path: string, params?: Record<string, any>): string => {
  const url = new URL(path, base);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
};

export const parseQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

// Color utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Math utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Async utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await delay(delayMs * attempt);
    }
  }
  
  throw lastError!;
};

// Rate limiting utilities
export const createRateLimiter = (requests: number, windowMs: number) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return (key: string): boolean => {
    const now = Date.now();
    const record = requestCounts.get(key);
    
    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= requests) {
      return false;
    }
    
    record.count++;
    return true;
  };
};

// Template utilities
export const renderTemplate = (template: string, variables: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
};

export const extractVariables = (template: string): string[] => {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  
  return matches.map(match => match.slice(2, -2));
};

// Feature flag utilities
export const isFeatureEnabled = (feature: string, userTier?: SubscriptionTier): boolean => {
  // Basic feature flag logic - can be enhanced with external service
  const tierRequirements: Record<string, SubscriptionTier[]> = {
    'ai-voice-cloning': [SubscriptionTier.BUSINESS, SubscriptionTier.ENTERPRISE],
    'white-label': [SubscriptionTier.ENTERPRISE],
    'api-access': [SubscriptionTier.BUSINESS, SubscriptionTier.ENTERPRISE],
    'bulk-processing': [SubscriptionTier.BUSINESS, SubscriptionTier.ENTERPRISE],
  };
  
  const requiredTiers = tierRequirements[feature];
  if (!requiredTiers || !userTier) return true;
  
  return requiredTiers.includes(userTier);
};

// Analytics utilities
export const trackEvent = (event: string, properties?: Record<string, any>): void => {
  if (typeof window !== 'undefined') {
    // Client-side analytics tracking
    if ((window as any).gtag) {
      (window as any).gtag('event', event, properties);
    }
    
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track(event, properties);
    }
  }
};