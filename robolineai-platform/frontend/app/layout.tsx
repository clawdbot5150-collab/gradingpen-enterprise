import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | RoboLineAI',
    default: 'RoboLineAI - Ultimate AI-Powered RPA Platform'
  },
  description: 'The next-generation Robotic Process Automation platform that combines AI intelligence with enterprise-grade scalability. Automate any business process with visual workflows, AI-powered computer vision, and intelligent document processing.',
  keywords: [
    'RPA',
    'Robotic Process Automation',
    'AI Automation',
    'Workflow Automation',
    'Business Process Automation',
    'Computer Vision',
    'Document Processing',
    'Enterprise Automation',
    'No-Code Automation',
    'Bot Management'
  ],
  authors: [{ name: 'RoboLineAI Team' }],
  creator: 'RoboLineAI',
  publisher: 'RoboLineAI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://robolineai.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'RoboLineAI',
    title: 'RoboLineAI - Ultimate AI-Powered RPA Platform',
    description: 'Automate any business process with AI-powered computer vision, natural language processing, and visual workflow design.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RoboLineAI Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoboLineAI - Ultimate AI-Powered RPA Platform',
    description: 'Automate any business process with AI-powered automation.',
    site: '@robolineai',
    creator: '@robolineai',
    images: ['/images/og-image.png'],
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}