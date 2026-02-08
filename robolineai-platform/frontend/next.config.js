/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  images: {
    domains: [
      'localhost',
      'robolineai.com',
      'cdn.robolineai.com',
      'images.unsplash.com',
      'via.placeholder.com'
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: `${process.env.BACKEND_URL}/graphql`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${process.env.BACKEND_URL}/auth/:path*`,
      },
      {
        source: '/api/webhooks/:path*',
        destination: `${process.env.BACKEND_URL}/webhooks/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ]
      }
    ]
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Monaco Editor support
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' }
    })

    // Handle canvas for react-flow
    config.externals.push({
      canvas: 'canvas'
    })

    return config
  },
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
}

module.exports = nextConfig