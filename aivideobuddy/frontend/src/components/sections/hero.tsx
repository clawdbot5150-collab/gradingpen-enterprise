'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRightIcon, PlayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/ui/video-player';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-20"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
              <SparklesIcon className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New: Advanced AI Models Available
              </span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
              Create{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                AI Videos
              </span>{' '}
              That Captivate
            </h1>
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Transform your ideas into stunning videos with the most advanced AI video generation platform. 
              From text prompts to professional videos in minutes.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>2.5M+ Videos Created</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>50K+ Active Creators</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>10+ AI Models</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto group">
                Start Creating Free
                <ArrowRightIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                <PlayIcon className="w-5 h-5 ml-0.5" />
              </div>
              <span className="font-medium">Watch Demo</span>
            </button>
          </motion.div>

          {/* Video Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
                <VideoPlayer
                  src="/videos/demo-video.mp4"
                  poster="/images/demo-thumbnail.jpg"
                  className="w-full aspect-video"
                />
              </div>
            </div>
          </motion.div>

          {/* Trusted By */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="pt-16"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
              Trusted by leading companies worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60 hover:opacity-80 transition-opacity">
              <img src="/images/logos/company1.svg" alt="Company 1" className="h-8" />
              <img src="/images/logos/company2.svg" alt="Company 2" className="h-8" />
              <img src="/images/logos/company3.svg" alt="Company 3" className="h-8" />
              <img src="/images/logos/company4.svg" alt="Company 4" className="h-8" />
              <img src="/images/logos/company5.svg" alt="Company 5" className="h-8" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center space-y-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Scroll to explore
          </span>
          <div className="w-6 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-300 dark:bg-gray-600 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}