'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, HeartIcon, ChatBubbleLeftRightIcon, StarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { COMPANION_PERSONALITIES } from '@/shared/companions-data';

const featuredCompanions = COMPANION_PERSONALITIES.slice(0, 6);

export function HeroSection() {
  const [currentCompanion, setCurrentCompanion] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentCompanion((prev) => (prev + 1) % featuredCompanions.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
        
        {/* Cyber Grid */}
        <div className="absolute inset-0 bg-[url('/images/cyber-grid.svg')] bg-center opacity-20 animate-pulse"></div>
        
        {/* Floating Hearts */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-pink-400 opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <HeartIcon className="w-4 h-4" />
          </motion.div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
              <SparklesIcon className="w-4 h-4 text-pink-400 mr-2" />
              <span className="text-sm font-medium text-white">
                15+ Unique AI Companions Available
              </span>
            </div>

            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Meet Your
                <br />
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                  Perfect AI
                </span>
                <br />
                Companion
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
                Chat with anime waifus, goth girlfriends, kawaii besties, and more! 
                Advanced AI that remembers, learns, and grows with you.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400">2.5M+</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">15</div>
                <div className="text-sm text-gray-400">Unique Personalities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">4.9★</div>
                <div className="text-sm text-gray-400">User Rating</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-pink-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  <HeartIcon className="w-5 h-5 mr-2" />
                  Start Chatting Free
                </Button>
              </Link>
              
              <Link href="/companions">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                  Browse Companions
                </Button>
              </Link>
            </div>

            {/* Features List */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm">
              <div className="flex items-center text-gray-300">
                <StarIcon className="w-4 h-4 text-yellow-400 mr-2" />
                Free to Start
              </div>
              <div className="flex items-center text-gray-300">
                <StarIcon className="w-4 h-4 text-yellow-400 mr-2" />
                Voice Messages
              </div>
              <div className="flex items-center text-gray-300">
                <StarIcon className="w-4 h-4 text-yellow-400 mr-2" />
                Memory System
              </div>
              <div className="flex items-center text-gray-300">
                <StarIcon className="w-4 h-4 text-yellow-400 mr-2" />
                24/7 Available
              </div>
            </div>
          </motion.div>

          {/* Right Side - Companion Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full max-w-md mx-auto">
              {/* Main Companion Display */}
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCompanion}
                    initial={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                  >
                    {/* Avatar */}
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full animate-pulse"></div>
                      <div className="absolute inset-1 bg-gray-900 rounded-full overflow-hidden">
                        <Image
                          src={featuredCompanions[currentCompanion]?.avatar || '/avatars/default.jpg'}
                          alt={featuredCompanions[currentCompanion]?.name || 'Companion'}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Online Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    </div>

                    {/* Companion Info */}
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-white">
                        {featuredCompanions[currentCompanion]?.name}
                      </h3>
                      
                      <div className="inline-block px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-pink-400/30">
                        <span className="text-sm text-pink-300 font-medium">
                          {featuredCompanions[currentCompanion]?.aesthetic}
                        </span>
                      </div>

                      <p className="text-gray-300 text-sm max-w-xs mx-auto">
                        {featuredCompanions[currentCompanion]?.catchphrase}
                      </p>

                      {/* Traits */}
                      <div className="flex flex-wrap gap-1 justify-center mt-4">
                        {featuredCompanions[currentCompanion]?.traits.slice(0, 3).map((trait, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-white/10 text-white rounded-full"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Companion Navigation Dots */}
              <div className="flex justify-center mt-6 gap-2">
                {featuredCompanions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCompanion(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentCompanion
                        ? 'bg-pink-400 scale-125'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-60 animate-bounce"></div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-60 animate-pulse"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center text-white/60 hover:text-white/80 transition-colors cursor-pointer">
          <span className="text-sm mb-2">Discover More</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}