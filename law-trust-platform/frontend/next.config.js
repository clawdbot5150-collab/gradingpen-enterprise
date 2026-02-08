/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/lawyers',
        destination: '/find-lawyer',
        permanent: true,
      },
    ];
  },

  // Rewrites for API and marketing pages
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:4000'}/api/:path*`,
      },
      {
        source: '/graphql',
        destination: `${process.env.API_URL || 'http://localhost:4000'}/graphql`,
      },
    ];
  },

  // Webpack configuration for performance
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Add support for loading .svg files as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Experimental features
  experimental: {
    // Enable app directory
    appDir: true,
    
    // Server components
    serverComponentsExternalPackages: ['mongoose', 'pg'],
    
    // Optimize font loading
    optimizeFonts: true,
    
    // Optimize images
    optimizeImages: true,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Output configuration for deployment
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  // Custom build ID for cache busting
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`;
  },
};

// Apply plugins
module.exports = withBundleAnalyzer(withPWA(nextConfig));