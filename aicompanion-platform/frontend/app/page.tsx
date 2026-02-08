import React from 'react';
import { Metadata } from 'next';
import { HeroSection } from '@/components/sections/hero-section';
import { CompanionsPreview } from '@/components/sections/companions-preview';
import { FeaturesSection } from '@/components/sections/features-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { PricingSection } from '@/components/sections/pricing-section';
import { CTASection } from '@/components/sections/cta-section';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'AI Companions - Your Perfect Digital Friend & Relationship Partner | AnimeAI',
  description: 'Meet your ideal AI companion! Chat with 15+ unique personalities including anime waifus, goth girlfriends, and kawaii besties. Advanced AI technology for meaningful conversations, emotional support, and digital relationships. Start free today!',
  keywords: 'AI companion, AI girlfriend, AI boyfriend, anime AI, virtual friend, digital relationship, AI chat, anime waifu, AI personality, virtual companion, chatbot girlfriend, AI romance, digital dating',
  authors: [{ name: 'AnimeAI Team' }],
  creator: 'AnimeAI Companions',
  publisher: 'AnimeAI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://aicompanionbuddy.com'),
  alternates: {
    canonical: 'https://aicompanionbuddy.com',
    languages: {
      'en-US': 'https://aicompanionbuddy.com',
      'ja-JP': 'https://aicompanionbuddy.com/ja',
      'ko-KR': 'https://aicompanionbuddy.com/ko',
      'zh-CN': 'https://aicompanionbuddy.com/zh',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aicompanionbuddy.com',
    title: 'AI Companions - Your Perfect Digital Friend & Relationship Partner',
    description: 'Meet your ideal AI companion! Chat with 15+ unique personalities including anime waifus, goth girlfriends, and kawaii besties.',
    siteName: 'AnimeAI Companions',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AnimeAI Companions - AI Girlfriend & Boyfriend Chat Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Companions - Your Perfect Digital Friend & Relationship Partner',
    description: 'Meet your ideal AI companion! Chat with 15+ unique personalities.',
    images: ['/images/twitter-card.jpg'],
    creator: '@AnimeAICompanions',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

// Structured Data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AnimeAI Companions',
  applicationCategory: 'SocialApplication',
  description: 'Advanced AI companion platform featuring anime, goth, and diverse personality types for meaningful digital relationships.',
  url: 'https://aicompanionbuddy.com',
  operatingSystem: 'Web Browser, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier available with premium subscriptions',
  },
  author: {
    '@type': 'Organization',
    name: 'AnimeAI',
    url: 'https://aicompanionbuddy.com',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '2847',
    bestRating: '5',
    worstRating: '1',
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main className="flex-1 overflow-hidden">
        <HeroSection />
        <CompanionsPreview />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}