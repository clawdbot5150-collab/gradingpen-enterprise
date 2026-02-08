import '@/styles/globals.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { SocketProvider } from '@/services/socketService'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

export default function App({ Component, pageProps, router }: AppProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const { initializeAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from localStorage
    initializeAuth()
    setIsHydrated(true)
  }, [initializeAuth])

  // Prevent hydration mismatch by not rendering until client-side
  if (!isHydrated) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider enabled={isAuthenticated}>
        <AnimatePresence mode="wait" initial={false}>
          <Component {...pageProps} key={router.route} />
        </AnimatePresence>
        
        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg',
            success: {
              className: 'bg-green-50 dark:bg-green-900 text-green-900 dark:text-green-100',
            },
            error: {
              className: 'bg-red-50 dark:bg-red-900 text-red-900 dark:text-red-100',
            },
          }}
        />
        
        {/* React Query DevTools */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </SocketProvider>
    </QueryClientProvider>
  )
}