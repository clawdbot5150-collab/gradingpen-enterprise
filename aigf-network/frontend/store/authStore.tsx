'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createContext, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

import type { User, UserProgress, LoginForm, RegisterForm } from '@/types';
import { authService } from '@/services/authService';
import { apiClient } from '@/services/apiClient';

interface AuthState {
  // State
  user: User | null;
  progress: UserProgress | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Tokens
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  
  // Actions
  login: (credentials: LoginForm) => Promise<boolean>;
  register: (data: RegisterForm) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateProgress: (progress: Partial<UserProgress>) => void;
  clearError: () => void;
  
  // Utility
  isTokenExpired: () => boolean;
  getAuthHeaders: () => Record<string, string>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      progress: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,

      // Actions
      login: async (credentials: LoginForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login(credentials);
          
          if (response.success && response.data) {
            const { user, progress, tokens } = response.data;
            
            // Calculate token expiry
            const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // Default 7 days
            
            // Set authentication data
            set({
              user,
              progress,
              isAuthenticated: true,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              tokenExpiry: expiryTime,
              isLoading: false,
              error: null
            });
            
            // Store tokens in secure cookies
            Cookies.set('access_token', tokens.accessToken, { 
              expires: 7, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict'
            });
            Cookies.set('refresh_token', tokens.refreshToken, { 
              expires: 30, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict'
            });
            
            // Set default auth headers
            apiClient.setAuthToken(tokens.accessToken);
            
            toast.success(`Welcome back, ${user.firstName || user.username}!`);
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Login failed' 
            });
            toast.error(response.error || 'Login failed');
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage 
          });
          toast.error(errorMessage);
          return false;
        }
      },

      register: async (data: RegisterForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.register(data);
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            // Calculate token expiry
            const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
            
            // Set authentication data
            set({
              user,
              progress: null, // Will be loaded separately
              isAuthenticated: true,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              tokenExpiry: expiryTime,
              isLoading: false,
              error: null
            });
            
            // Store tokens in cookies
            Cookies.set('access_token', tokens.accessToken, { 
              expires: 7, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict'
            });
            Cookies.set('refresh_token', tokens.refreshToken, { 
              expires: 30, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict'
            });
            
            // Set default auth headers
            apiClient.setAuthToken(tokens.accessToken);
            
            toast.success('Account created successfully! Welcome to AIGFNetwork!');
            return true;
          } else {
            set({ 
              isLoading: false, 
              error: response.error || 'Registration failed' 
            });
            toast.error(response.error || 'Registration failed');
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage 
          });
          toast.error(errorMessage);
          return false;
        }
      },

      logout: () => {
        // Clear state
        set({
          user: null,
          progress: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
          error: null
        });
        
        // Clear cookies
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        
        // Clear API client token
        apiClient.clearAuthToken();
        
        // Clear localStorage (handled by persist middleware)
        localStorage.removeItem('auth-storage');
        
        toast.success('Logged out successfully');
      },

      refreshAuth: async () => {
        const { refreshToken, isTokenExpired } = get();
        
        if (!refreshToken || isTokenExpired()) {
          get().logout();
          return false;
        }

        try {
          const response = await authService.refreshToken(refreshToken);
          
          if (response.success && response.data) {
            const { tokens } = response.data;
            const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
            
            set({
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              tokenExpiry: expiryTime,
              error: null
            });
            
            // Update cookies
            Cookies.set('access_token', tokens.accessToken, { 
              expires: 7, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict'
            });
            Cookies.set('refresh_token', tokens.refreshToken, { 
              expires: 30, 
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict'
            });
            
            // Update API client token
            apiClient.setAuthToken(tokens.accessToken);
            
            return true;
          } else {
            get().logout();
            return false;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
          return false;
        }
      },

      updateUser: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;
        
        try {
          set({ isLoading: true });
          
          const response = await authService.updateProfile(updates);
          
          if (response.success && response.data) {
            set({
              user: { ...user, ...response.data },
              isLoading: false
            });
            toast.success('Profile updated successfully');
          } else {
            set({ isLoading: false });
            toast.error(response.error || 'Failed to update profile');
          }
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.message || 'Failed to update profile');
        }
      },

      updateProgress: (progress: Partial<UserProgress>) => {
        const currentProgress = get().progress;
        set({
          progress: currentProgress ? { ...currentProgress, ...progress } : null
        });
      },

      clearError: () => set({ error: null }),

      // Utility functions
      isTokenExpired: () => {
        const { tokenExpiry } = get();
        if (!tokenExpiry) return true;
        return Date.now() >= tokenExpiry;
      },

      getAuthHeaders: () => {
        const { accessToken } = get();
        return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        progress: state.progress,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && !state.isTokenExpired()) {
          // Set auth token on rehydration if valid
          apiClient.setAuthToken(state.accessToken);
        } else if (state?.isAuthenticated) {
          // Clear invalid authentication
          state.logout();
        }
      }
    }
  )
);

// Context for auth store
const AuthContext = createContext<ReturnType<typeof useAuthStore> | null>(null);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useAuthStore();

  useEffect(() => {
    // Initialize auth on app start
    const initializeAuth = async () => {
      const { isAuthenticated, isTokenExpired, refreshAuth, logout } = store.getState();
      
      // Check cookies for tokens (in case localStorage was cleared)
      const cookieToken = Cookies.get('access_token');
      const cookieRefreshToken = Cookies.get('refresh_token');
      
      if (!isAuthenticated && cookieToken) {
        // Try to restore from cookies
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser.success && currentUser.data) {
            store.setState({
              user: currentUser.data.user,
              progress: currentUser.data.progress,
              isAuthenticated: true,
              accessToken: cookieToken,
              refreshToken: cookieRefreshToken || null
            });
            apiClient.setAuthToken(cookieToken);
          }
        } catch (error) {
          // Clear invalid cookies
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
        }
      } else if (isAuthenticated && isTokenExpired()) {
        // Try to refresh token
        const refreshed = await refreshAuth();
        if (!refreshed) {
          logout();
        }
      } else if (isAuthenticated && store.getState().accessToken) {
        // Set auth token for existing session
        apiClient.setAuthToken(store.getState().accessToken!);
      }
    };

    initializeAuth();

    // Set up automatic token refresh
    const refreshInterval = setInterval(() => {
      const { isAuthenticated, isTokenExpired, refreshAuth } = store.getState();
      
      if (isAuthenticated && isTokenExpired()) {
        refreshAuth();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [store]);

  return (
    <AuthContext.Provider value={store}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth store
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Selector hooks for performance
export function useUser() {
  return useAuthStore((state) => state.user);
}

export function useIsAuthenticated() {
  return useAuthStore((state) => state.isAuthenticated);
}

export function useUserProgress() {
  return useAuthStore((state) => state.progress);
}

export function useAuthLoading() {
  return useAuthStore((state) => state.isLoading);
}

export function useAuthError() {
  return useAuthStore((state) => state.error);
}