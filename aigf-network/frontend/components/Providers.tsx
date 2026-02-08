'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/store/authStore';
import { SettingsProvider } from '@/store/settingsStore';
import { ChatProvider } from '@/store/chatStore';
import { ProgressProvider } from '@/store/progressStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingProvider } from '@/components/LoadingProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Initialize app on mount
  useEffect(() => {
    // Set up global error handling
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // You could send this to an error reporting service
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      // You could send this to an error reporting service
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Set up performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor navigation timing
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
          console.log(`Page load time: ${loadTime}ms`);
        }
      });
    }

    // Set up viewport height fix for mobile browsers
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Set up keyboard navigation improvements
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab navigation indicator
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <ErrorBoundary>
      <LoadingProvider>
        <SettingsProvider>
          <AuthProvider>
            <ProgressProvider>
              <ChatProvider>
                {children}
              </ChatProvider>
            </ProgressProvider>
          </AuthProvider>
        </SettingsProvider>
      </LoadingProvider>
    </ErrorBoundary>
  );
}