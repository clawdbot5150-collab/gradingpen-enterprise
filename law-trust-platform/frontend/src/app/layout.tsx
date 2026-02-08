import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import './globals.css';
import { Providers } from '@/components/Providers';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Law Trust - Premium Legal Lead Generation',
    default: 'Law Trust - Premium Legal Lead Generation Platform',
  },
  description: 'The ultimate legal lead generation platform connecting qualified clients with top-rated attorneys. Premium leads for Personal Injury, Estate Planning, Business Law, and more.',
  keywords: [
    'legal leads',
    'attorney marketing',
    'personal injury lawyer',
    'estate planning attorney',
    'legal lead generation',
    'qualified legal leads',
    'lawyer referrals',
    'legal marketing',
    'attorney leads',
    'law firm marketing'
  ],
  authors: [{ name: 'Law Trust Platform' }],
  creator: 'Law Trust Platform',
  publisher: 'Law Trust Platform',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://law-trust.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Law Trust - Premium Legal Lead Generation Platform',
    description: 'The ultimate legal lead generation platform connecting qualified clients with top-rated attorneys.',
    siteName: 'Law Trust',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Law Trust - Premium Legal Lead Generation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Law Trust - Premium Legal Lead Generation Platform',
    description: 'The ultimate legal lead generation platform connecting qualified clients with top-rated attorneys.',
    images: ['/twitter-image.jpg'],
    creator: '@lawtrust',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#2563eb',
          colorTextOnPrimaryBackground: '#ffffff',
        },
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
          footerActionLink: 'text-blue-600 hover:text-blue-700',
        },
      }}
    >
      <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="theme-color" content="#2563eb" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Law Trust" />
          
          {/* Preconnect to external domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://api.stripe.com" />
          
          {/* DNS prefetch for better performance */}
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          
          {/* Structured data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ProfessionalService',
                name: 'Law Trust',
                description: 'Premium legal lead generation platform',
                url: 'https://law-trust.com',
                telephone: '+1-888-LAW-TRUST',
                address: {
                  '@type': 'PostalAddress',
                  addressCountry: 'US',
                },
                sameAs: [
                  'https://twitter.com/lawtrust',
                  'https://linkedin.com/company/lawtrust',
                ],
              }),
            }}
          />
        </head>
        
        <body className={`min-h-screen bg-white font-inter antialiased`}>
          <Providers>
            {/* Skip to main content for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white px-4 py-2 z-50"
            >
              Skip to main content
            </a>
            
            {/* Emergency Banner - only show during emergencies */}
            {process.env.NEXT_PUBLIC_EMERGENCY_BANNER === 'true' && (
              <div className="bg-red-600 text-white py-2 px-4 text-center text-sm font-medium">
                🚨 24/7 Emergency Legal Hotline: 
                <a href="tel:+18887278787" className="ml-2 underline font-bold">
                  1-888-727-8787
                </a>
              </div>
            )}
            
            <Navigation />
            
            <main id="main-content" role="main" className="flex-1">
              {children}
            </main>
            
            <Footer />
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 7000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            
            {/* Performance monitoring */}
            <Analytics />
            <SpeedInsights />
          </Providers>
          
          {/* Chat widget */}
          <div id="chat-widget-container" />
          
          {/* Stripe.js preload */}
          <script src="https://js.stripe.com/v3/" async />
          
          {/* Google Analytics */}
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <>
              <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                      page_title: document.title,
                      page_location: window.location.href,
                    });
                  `,
                }}
              />
            </>
          )}
          
          {/* Facebook Pixel */}
          {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}