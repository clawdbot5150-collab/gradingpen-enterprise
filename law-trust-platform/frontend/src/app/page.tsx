import type { Metadata } from 'next';
import { HeroSection } from '@/components/home/HeroSection';
import { PracticeAreasSection } from '@/components/home/PracticeAreasSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { StatsSection } from '@/components/home/StatsSection';
import { EmergencyBanner } from '@/components/home/EmergencyBanner';
import { LawyerCTASection } from '@/components/home/LawyerCTASection';
import { FAQSection } from '@/components/home/FAQSection';
import { TrustIndicators } from '@/components/home/TrustIndicators';
import { LeadCaptureForm } from '@/components/forms/LeadCaptureForm';

export const metadata: Metadata = {
  title: 'Find Top-Rated Lawyers | Get Expert Legal Help Now',
  description: 'Connect with qualified attorneys in minutes. Free case evaluation for Personal Injury, Estate Planning, Business Law, Criminal Defense, and more. 24/7 emergency legal hotline available.',
  keywords: [
    'find lawyer near me',
    'personal injury attorney',
    'estate planning lawyer',
    'free legal consultation',
    'top rated lawyers',
    'legal help',
    'attorney referral',
    'car accident lawyer',
    'medical malpractice attorney',
    '24/7 legal hotline'
  ],
  openGraph: {
    title: 'Find Top-Rated Lawyers | Get Expert Legal Help Now',
    description: 'Connect with qualified attorneys in minutes. Free case evaluation available.',
    images: [
      {
        url: '/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Law Trust - Find Top-Rated Lawyers',
      },
    ],
  },
  alternates: {
    canonical: '/',
  },
};

// JSON-LD structured data for better SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Law Trust',
  url: 'https://law-trust.com',
  description: 'Premium legal lead generation platform connecting clients with top-rated attorneys',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://law-trust.com/find-lawyer?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
  sameAs: [
    'https://twitter.com/lawtrust',
    'https://linkedin.com/company/lawtrust',
    'https://facebook.com/lawtrust',
  ],
};

export default function HomePage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Emergency Banner for urgent legal matters */}
      <EmergencyBanner />

      {/* Hero Section with Primary Lead Capture */}
      <HeroSection />

      {/* Trust Indicators */}
      <TrustIndicators />

      {/* Key Statistics */}
      <StatsSection />

      {/* Practice Areas Grid */}
      <PracticeAreasSection />

      {/* How It Works Process */}
      <HowItWorksSection />

      {/* Client Testimonials */}
      <TestimonialsSection />

      {/* Secondary Lead Capture */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Get Your Free Case Evaluation
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Connect with a qualified attorney in your area within minutes
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <LeadCaptureForm 
              source="homepage_secondary"
              variant="compact"
              onSuccess={(leadId) => {
                // Track conversion
                if (typeof gtag !== 'undefined') {
                  gtag('event', 'conversion', {
                    send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
                    value: 1,
                    currency: 'USD',
                    event_category: 'Lead Generation',
                    event_label: 'Homepage Secondary Form',
                  });
                }
                
                // Redirect to thank you page
                window.location.href = `/thank-you?lead=${leadId}`;
              }}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Lawyer CTA Section */}
      <LawyerCTASection />

      {/* Final CTA with urgency */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
              Don't Wait - Legal Deadlines Matter
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Many legal matters have strict time limits. Get the help you need before it's too late.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="tel:+18887278787"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Now: 1-888-LAW-TRUST
              </a>
              
              <span className="text-gray-400">or</span>
              
              <button
                onClick={() => {
                  document.getElementById('hero-form')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                  });
                }}
                className="inline-flex items-center px-8 py-4 border border-gray-600 text-lg font-medium rounded-lg text-white bg-transparent hover:bg-gray-800 transition-all duration-200"
              >
                Get Free Case Review
              </button>
            </div>
            
            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-70">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">A+</div>
                <div className="text-sm text-gray-400">BBB Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">FREE</div>
                <div className="text-sm text-gray-400">Consultation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1M+</div>
                <div className="text-sm text-gray-400">Cases Handled</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}