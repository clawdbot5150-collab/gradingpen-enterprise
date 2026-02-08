'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User, SubscriptionTier } from '@aivideobuddy/shared';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_CREDITS'; payload: number };

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'UPDATE_CREDITS':
      return {
        ...state,
        user: state.user ? { ...state.user, credits: action.payload } : null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = Cookies.get('accessToken');
        if (!token) {
          dispatch({ type: 'AUTH_FAILURE', payload: 'No token found' });
          return;
        }

        const response = await api.get('/auth/me');
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      } catch (error: any) {
        // Try to refresh the token
        try {
          await refreshTokens();
          const response = await api.get('/auth/me');
          dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        } catch (refreshError) {
          dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' });
          clearTokens();
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        rememberMe,
      });

      const { user, tokens } = response.data.data;

      // Store tokens
      const cookieOptions = {
        expires: rememberMe ? 7 : 1, // 7 days or 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
      };

      Cookies.set('accessToken', tokens.accessToken, cookieOptions);
      Cookies.set('refreshToken', tokens.refreshToken, {
        ...cookieOptions,
        expires: 7, // Refresh token always lasts 7 days
      });

      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw new Error(message);
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await api.post('/auth/register', userData);
      const { user, tokens } = response.data.data;

      // Store tokens
      Cookies.set('accessToken', tokens.accessToken, { expires: 1 });
      Cookies.set('refreshToken', tokens.refreshToken, { expires: 7 });

      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    }

    clearTokens();
    dispatch({ type: 'AUTH_LOGOUT' });
    router.push('/');
  };

  const refreshAuth = async () => {
    try {
      await refreshTokens();
      const response = await api.get('/auth/me');
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to refresh authentication' });
      clearTokens();
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.put('/users/profile', data);
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to update profile';
      throw new Error(message);
    }
  };

  const refreshTokens = async () => {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    const { tokens } = response.data.data;

    Cookies.set('accessToken', tokens.accessToken, { expires: 1 });
    Cookies.set('refreshToken', tokens.refreshToken, { expires: 7 });
  };

  const clearTokens = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hooks
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}

export function useSubscriptionCheck(requiredTier: SubscriptionTier) {
  const { user } = useAuth();
  
  const tierHierarchy = {
    FREE: 0,
    PRO: 1,
    BUSINESS: 2,
    ENTERPRISE: 3,
  };

  const userTierLevel = user ? tierHierarchy[user.subscription] : -1;
  const requiredTierLevel = tierHierarchy[requiredTier];

  return {
    hasAccess: userTierLevel >= requiredTierLevel,
    userTier: user?.subscription,
    requiredTier,
  };
}