'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/auth-context';
import { SocketProvider } from '@/contexts/socket-context';
import { ToastProvider } from '@/contexts/toast-context';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && 'status' in error && 
            typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              {children}
              {/* Only show React Query devtools in development */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}