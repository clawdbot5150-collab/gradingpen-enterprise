import { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { Features } from '@/components/sections/features';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Pricing } from '@/components/sections/pricing';
import { Testimonials } from '@/components/sections/testimonials';
import { FAQ } from '@/components/sections/faq';
import { CTA } from '@/components/sections/cta';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'AIVideoBuddy - Ultimate AI Video Creation Platform',
  description: 'Create stunning AI-powered videos with text-to-video generation, image animation, and advanced video editing tools. Join thousands of creators using the most comprehensive AI video platform.',
  keywords: 'AI video generation, text to video, AI video creator, video editing AI, AI animation, video marketing',
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}