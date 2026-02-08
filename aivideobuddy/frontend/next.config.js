/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'value',
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'aivideobuddy.com',
      's3.amazonaws.com',
      'cloudflare.com',
      'd1fd34e6f5a1234567890.cloudfront.net', // CloudFront domain
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=self, microphone=self, geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/videos',
        permanent: false,
      },
    ];
  },

  // Rewrites for API proxy (development)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack configuration
    
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      );
    }

    // Fabric.js configuration for canvas
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'commonjs canvas',
    });

    // Add aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    return config;
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    turbotrace: {
      logLevel: 'error',
    },
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src', 'pages', 'components', 'lib', 'utils'],
  },

  // Static export configuration
  trailingSlash: false,
  
  // PWA configuration would go here if using next-pwa
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  // },
};

// Wrap with PWA if needed
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
//   register: true,
//   skipWaiting: true,
// });

module.exports = nextConfig;