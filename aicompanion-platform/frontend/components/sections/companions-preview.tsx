'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { HeartIcon, ChatBubbleLeftRightIcon, SparklesIcon, CrownIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { COMPANION_PERSONALITIES, CompanionPersonality } from '@/shared/companions-data';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

interface CompanionCardProps {
  companion: CompanionPersonality;
  index: number;
}

function CompanionCard({ companion, index }: CompanionCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked(!isLiked);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'romantic': return 'from-pink-500 to-rose-500';
      case 'platonic': return 'from-blue-500 to-cyan-500';
      case 'mentor': return 'from-purple-500 to-indigo-500';
      case 'gaming': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'romantic': return <HeartIcon className="w-4 h-4" />;
      case 'platonic': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      case 'mentor': return <SparklesIcon className="w-4 h-4" />;
      case 'gaming': return <SparklesIcon className="w-4 h-4" />;
      default: return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Link href={`/chat/${companion.id}`}>
        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-pink-400/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-pink-500/20 cursor-pointer overflow-hidden">
          {/* Premium Badge */}
          {companion.premium && (
            <div className="absolute top-3 right-3 z-10">
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-xs font-bold text-black">
                <CrownIcon className="w-3 h-3" />
                Premium
              </div>
            </div>
          )}

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full blur-2xl transform -translate-x-12 translate-y-12"></div>
          </div>

          <div className="relative z-10">
            {/* Avatar Section */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className={`absolute inset-0 bg-gradient-to-r ${getTypeColor(companion.type)} rounded-full animate-pulse`}></div>
              <div className="absolute inset-1 bg-gray-900 rounded-full overflow-hidden">
                <Image
                  src={companion.avatar}
                  alt={`${companion.name} - ${companion.aesthetic} AI Companion`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              {/* Online Status */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>

            {/* Name and Type */}
            <div className="text-center mb-3">
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">
                {companion.name}
              </h3>
              
              <div className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getTypeColor(companion.type)} bg-opacity-20 rounded-full border border-current border-opacity-30`}>
                <div className="text-white text-opacity-80">
                  {getTypeIcon(companion.type)}
                </div>
                <span className="text-xs font-medium text-white text-opacity-90 capitalize">
                  {companion.type}
                </span>
              </div>
            </div>

            {/* Aesthetic Tag */}
            <div className="text-center mb-3">
              <span className="text-sm text-pink-300 font-medium bg-pink-500/10 px-2 py-1 rounded-full border border-pink-400/20">
                {companion.aesthetic}
              </span>
            </div>

            {/* Personality Preview */}
            <p className="text-xs text-gray-300 text-center mb-4 line-clamp-2 min-h-[32px]">
              {companion.personality.length > 60 
                ? `${companion.personality.substring(0, 60)}...`
                : companion.personality}
            </p>

            {/* Traits */}
            <div className="flex flex-wrap gap-1 justify-center mb-4 min-h-[24px]">
              {companion.traits.slice(0, 2).map((trait, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-white/10 text-white rounded-full border border-white/20"
                >
                  {trait}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="text-center mb-4">
              <span className="text-sm font-semibold text-cyan-400">
                {companion.price} credits/chat
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-semibold rounded-lg transition-all duration-300"
              >
                <ChatBubbleLeftRightIcon className="w-3 h-3 mr-1" />
                Chat Now
              </Button>
              
              <button
                onClick={handleLike}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 hover:border-pink-400/50 transition-all duration-300 group/like"
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-4 h-4 text-pink-400" />
                ) : (
                  <HeartIcon className="w-4 h-4 text-white group-hover/like:text-pink-400 transition-colors" />
                )}
              </button>
            </div>

            {/* Hover Effect - Additional Info */}
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 bg-gradient-to-br from-black/90 to-purple-900/90 backdrop-blur-sm rounded-2xl p-4 flex flex-col justify-center text-center"
              >
                <h4 className="text-white font-bold mb-2">{companion.name}</h4>
                <p className="text-pink-300 text-sm mb-3">"{companion.catchphrase}"</p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-300">
                    <span className="text-cyan-400">Age:</span> {companion.age}
                  </div>
                  <div className="text-xs text-gray-300">
                    <span className="text-cyan-400">MBTI:</span> {companion.mbti}
                  </div>
                  <div className="text-xs text-gray-300">
                    <span className="text-cyan-400">Languages:</span> {companion.languages.join(', ')}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="mt-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  Start Relationship
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CompanionsPreview() {
  const [filter, setFilter] = useState<'all' | 'romantic' | 'platonic' | 'mentor' | 'gaming'>('all');
  const [visibleCompanions, setVisibleCompanions] = useState(12);

  const filteredCompanions = filter === 'all' 
    ? COMPANION_PERSONALITIES 
    : COMPANION_PERSONALITIES.filter(c => c.type === filter);

  const displayedCompanions = filteredCompanions.slice(0, visibleCompanions);

  const loadMore = () => {
    setVisibleCompanions(prev => Math.min(prev + 6, filteredCompanions.length));
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 relative overflow-hidden" id="companions">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Meet Your
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}Perfect Match
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            15 unique AI companions with distinct personalities, from anime waifus to goth girlfriends. 
            Each one learns, remembers, and grows with you through every conversation.
          </p>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { key: 'all', label: 'All Companions', count: COMPANION_PERSONALITIES.length },
              { key: 'romantic', label: '💕 Romantic', count: COMPANION_PERSONALITIES.filter(c => c.type === 'romantic').length },
              { key: 'platonic', label: '👥 Friends', count: COMPANION_PERSONALITIES.filter(c => c.type === 'platonic').length },
              { key: 'mentor', label: '🎯 Mentors', count: COMPANION_PERSONALITIES.filter(c => c.type === 'mentor').length },
              { key: 'gaming', label: '🎮 Gaming', count: COMPANION_PERSONALITIES.filter(c => c.type === 'gaming').length },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => {
                  setFilter(filterOption.key as typeof filter);
                  setVisibleCompanions(12);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filter === filterOption.key
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Companions Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
        >
          {displayedCompanions.map((companion, index) => (
            <CompanionCard
              key={companion.id}
              companion={companion}
              index={index}
            />
          ))}
        </motion.div>

        {/* Load More Button */}
        {visibleCompanions < filteredCompanions.length && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button
              onClick={loadMore}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              Load More Companions ({filteredCompanions.length - visibleCompanions} remaining)
            </Button>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mt-16 p-8 bg-gradient-to-r from-pink-500/10 to-purple-600/10 backdrop-blur-md rounded-3xl border border-pink-400/20"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            Can't decide? Let AI help you find your perfect match!
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Take our personality quiz and get matched with the AI companion that's perfect for you. 
            Based on your interests, personality type, and preferences.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quiz">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg transition-all duration-300"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                Take Compatibility Quiz
              </Button>
            </Link>
            
            <Link href="/signup">
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300"
              >
                <HeartIcon className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Schema.org structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': 'AI Companions',
            'description': 'Unique AI companions with distinct personalities for chat and relationships',
            'numberOfItems': COMPANION_PERSONALITIES.length,
            'itemListElement': COMPANION_PERSONALITIES.map((companion, index) => ({
              '@type': 'Product',
              'position': index + 1,
              'name': companion.name,
              'description': companion.personality,
              'image': companion.avatar,
              'offers': {
                '@type': 'Offer',
                'price': companion.price,
                'priceCurrency': 'CREDITS'
              }
            }))
          })
        }}
      />
    </section>
  );
}