import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | AIVideoBuddy - Ultimate AI Video Creation Platform',
    default: 'AIVideoBuddy - Ultimate AI Video Creation Platform',
  },
  description: 'Create stunning AI-powered videos with text-to-video generation, image animation, and advanced video editing tools. The most comprehensive AI video platform for creators, marketers, and businesses.',
  keywords: [
    'AI video generation',
    'text to video',
    'AI video creator',
    'video editing AI',
    'AI animation',
    'video marketing',
    'content creation',
    'automated video',
    'AI film maker',
    'video AI',
  ],
  authors: [{ name: 'AIVideoBuddy Team' }],
  creator: 'AIVideoBuddy',
  publisher: 'AIVideoBuddy',
  metadataBase: new URL('https://aivideobuddy.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aivideobuddy.com',
    siteName: 'AIVideoBuddy',
    title: 'AIVideoBuddy - Ultimate AI Video Creation Platform',
    description: 'Create stunning AI-powered videos with text-to-video generation, image animation, and advanced video editing tools.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AIVideoBuddy - AI Video Creation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aivideobuddy',
    creator: '@aivideobuddy',
    title: 'AIVideoBuddy - Ultimate AI Video Creation Platform',
    description: 'Create stunning AI-powered videos with text-to-video generation, image animation, and advanced video editing tools.',
    images: ['/images/twitter-image.jpg'],
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
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    other: {
      'msvalidate.01': 'your-bing-verification-code',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />
        
        {/* Analytics */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
            
            {/* Hotjar */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function(h,o,t,j,a,r){
                    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                    h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                    a=o.getElementsByTagName('head')[0];
                    r=o.createElement('script');r.async=1;
                    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                    a.appendChild(r);
                  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased selection:bg-primary-100 selection:text-primary-900 dark:bg-gray-900 dark:text-gray-100 dark:selection:bg-primary-900 dark:selection:text-primary-100">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </Providers>
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "AIVideoBuddy",
              "description": "Ultimate AI Video Creation Platform for text-to-video generation, image animation, and advanced video editing",
              "url": "https://aivideobuddy.com",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "2547"
              },
              "author": {
                "@type": "Organization",
                "name": "AIVideoBuddy"
              }
            })
          }}
        />
      </body>
    </html>
  );
}