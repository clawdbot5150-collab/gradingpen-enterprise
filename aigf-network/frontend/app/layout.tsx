import type { Metadata, Viewport } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import './globals.css';
import { Providers } from '@/components/Providers';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SocketProvider } from '@/components/SocketProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap'
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
  colorScheme: 'light dark'
};

export const metadata: Metadata = {
  title: {
    template: '%s | AIGFNetwork',
    default: 'AIGFNetwork - Master Your Social Confidence'
  },
  description: 'Transform your social skills with AI-powered conversation practice. Build genuine confidence through personalized training scenarios and real-time feedback.',
  keywords: [
    'social confidence',
    'conversation practice',
    'AI training',
    'social skills',
    'personal development',
    'communication skills',
    'dating confidence',
    'workplace communication',
    'networking skills'
  ],
  authors: [{ name: 'AIGFNetwork Team' }],
  creator: 'AIGFNetwork',
  publisher: 'AIGFNetwork',
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false
  },
  metadataBase: new URL(
    process.env.NODE_ENV === 'production' 
      ? 'https://aigfnetwork.com' 
      : 'http://localhost:3000'
  ),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'es-ES': '/es-ES',
      'fr-FR': '/fr-FR',
      'de-DE': '/de-DE'
    }
  },
  openGraph: {
    title: 'AIGFNetwork - Master Your Social Confidence',
    description: 'Transform your social skills with AI-powered conversation practice. Build genuine confidence through personalized training scenarios.',
    url: '/',
    siteName: 'AIGFNetwork',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AIGFNetwork - Social Confidence Training Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIGFNetwork - Master Your Social Confidence',
    description: 'Transform your social skills with AI-powered conversation practice.',
    site: '@aigfnetwork',
    creator: '@aigfnetwork',
    images: ['/images/twitter-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#0ea5e9'
      }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AIGFNetwork'
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent'
  }
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${firaCode.variable}`} 
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/images/hero-bg.webp" as="image" />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Preconnect for critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="origin-when-cross-origin" />
        
        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        
        {/* Web app manifest and PWA */}
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="background-color" content="#ffffff" />
        <meta name="display" content="standalone" />
        <meta name="orientation" content="portrait" />
      </head>
      <body 
        className={`
          min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 
          dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 
          font-sans antialiased selection:bg-primary-200 selection:text-primary-900
        `}
        suppressHydrationWarning
      >
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                     bg-primary-600 text-white px-4 py-2 rounded-md z-50 
                     hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
        >
          Skip to main content
        </a>

        {/* Providers hierarchy */}
        <ThemeProvider>
          <Providers>
            <SocketProvider>
              {/* Background decorative elements */}
              <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-400/20 to-primary-400/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-secondary-400/10 to-accent-400/10 rounded-full blur-3xl animate-pulse-slow" />
              </div>

              {/* Main application content */}
              <div className="relative z-10 flex flex-col min-h-screen">
                <main id="main-content" className="flex-1">
                  {children}
                </main>
              </div>

              {/* Toast notifications */}
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName="!top-20"
                toastOptions={{
                  duration: 5000,
                  className: 'glass',
                  style: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#1f2937'
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#ffffff'
                    }
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#ffffff'
                    }
                  }
                }}
              />

              {/* Screen reader announcements */}
              <div 
                id="screen-reader-announcements" 
                className="sr-only" 
                aria-live="polite" 
                aria-atomic="true"
              />

              {/* Loading indicator for route changes */}
              <div 
                id="loading-indicator" 
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 z-50 opacity-0 transition-opacity duration-300"
                style={{ transform: 'translateX(-100%)' }}
              />
            </SocketProvider>
          </Providers>
        </ThemeProvider>

        {/* Development tools */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
            <div className="glass rounded-lg p-2 text-xs font-mono text-slate-600 dark:text-slate-300">
              <div>Dev Mode</div>
              <div className="flex space-x-2 mt-1">
                <span className="block sm:hidden">XS</span>
                <span className="hidden sm:block md:hidden">SM</span>
                <span className="hidden md:block lg:hidden">MD</span>
                <span className="hidden lg:block xl:hidden">LG</span>
                <span className="hidden xl:block 2xl:hidden">XL</span>
                <span className="hidden 2xl:block">2XL</span>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}