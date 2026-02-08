import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import type { APIResponse, PaginatedResponse } from '@/types';

class APIClient {
  private client: AxiosInstance;
  private baseURL: string;
  private authToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    this.client = axios.create({
      baseURL: this.baseURL + '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add request timestamp
        config.metadata = { startTime: Date.now() };

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Calculate request duration
        if (response.config.metadata?.startTime) {
          const duration = Date.now() - response.config.metadata.startTime;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
          }
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Calculate request duration for failed requests
        if (originalRequest?.metadata?.startTime) {
          const duration = Date.now() - originalRequest.metadata.startTime;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ ${originalRequest.method?.toUpperCase()} ${originalRequest.url} (${duration}ms) - ${error.response?.status || 'Network Error'}`);
          }
        }

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If we're already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Attempt to refresh the token
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await axios.post(`${this.baseURL}/api/auth/refresh`, {
                refreshToken
              });

              if (response.data?.tokens?.accessToken) {
                const newToken = response.data.tokens.accessToken;
                this.setAuthToken(newToken);
                
                // Process failed queue
                this.processQueue(null, newToken);
                
                // Retry original request
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, clear auth and redirect to login
            this.processQueue(refreshError, null);
            this.clearAuth();
            
            // Don't show toast for auth errors on protected routes
            if (!window.location.pathname.startsWith('/auth')) {
              toast.error('Your session has expired. Please log in again.');
              window.location.href = '/auth/login';
            }
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other HTTP errors
        this.handleError(error);
        
        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private handleError(error: AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as any;
    
    // Don't show toasts for auth-related endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    
    if (!isAuthEndpoint) {
      switch (status) {
        case 400:
          toast.error(data?.message || 'Bad request');
          break;
        case 403:
          toast.error('Access denied. You do not have permission for this action.');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 429:
          toast.error('Too many requests. Please slow down.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          if (!error.response) {
            // Network error
            toast.error('Network error. Please check your connection.');
          }
          break;
      }
    }
  }

  private getRefreshToken(): string | null {
    // Try to get refresh token from cookies or localStorage
    if (typeof window !== 'undefined') {
      return document.cookie
        .split('; ')
        .find(row => row.startsWith('refresh_token='))
        ?.split('=')[1] || null;
    }
    return null;
  }

  private clearAuth() {
    this.authToken = null;
    
    if (typeof window !== 'undefined') {
      // Clear cookies
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Clear localStorage
      localStorage.removeItem('auth-storage');
    }
  }

  // Public methods
  public setAuthToken(token: string) {
    this.authToken = token;
  }

  public clearAuthToken() {
    this.authToken = null;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  // HTTP methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      const response = await this.client.get(url, config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      const response = await this.client.post(url, data, config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      const response = await this.client.put(url, data, config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      const response = await this.client.patch(url, data, config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      const response = await this.client.delete(url, config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  // Specialized methods
  public async uploadFile<T = any>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<APIResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  public async downloadFile(url: string, filename: string): Promise<boolean> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob'
      });

      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
      return false;
    }
  }

  public async getPaginated<T = any>(
    url: string, 
    page = 1, 
    limit = 20, 
    params?: Record<string, any>
  ): Promise<APIResponse<PaginatedResponse<T>>> {
    try {
      const response = await this.client.get(url, {
        params: {
          page,
          limit,
          ...params
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.formatError(error as AxiosError);
    }
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Error formatting
  private formatError(error: AxiosError): APIResponse {
    const response = error.response?.data as any;
    
    return {
      success: false,
      error: response?.error || error.message || 'An error occurred',
      message: response?.message || error.message
    };
  }

  // Request cancellation
  public createCancelToken() {
    return axios.CancelToken.source();
  }

  public isCancel(error: any): boolean {
    return axios.isCancel(error);
  }
}

// Create and export singleton instance
export const apiClient = new APIClient();

// Type extensions
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
    _retry?: boolean;
  }
}