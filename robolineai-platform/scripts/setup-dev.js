#!/usr/bin/env node

/**
 * RoboLineAI Platform - Development Setup Script
 * 
 * This script sets up the complete development environment for RoboLineAI,
 * including all dependencies, database setup, and initial configuration.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('🚀 RoboLineAI Development Environment Setup')
console.log('==========================================\n')

async function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  try {
    // Check Node.js version
    console.log('📋 Checking system requirements...')
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
    
    if (majorVersion < 18) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Please install Node.js 18 or higher.`)
    }
    console.log(`✅ Node.js version ${nodeVersion} is compatible`)

    // Check Docker
    try {
      execSync('docker --version', { stdio: 'pipe' })
      console.log('✅ Docker is installed')
    } catch (error) {
      throw new Error('Docker is not installed. Please install Docker Desktop.')
    }

    // Check Python
    try {
      execSync('python3 --version', { stdio: 'pipe' })
      console.log('✅ Python 3 is installed')
    } catch (error) {
      console.log('⚠️ Python 3 not found, some AI features may not work')
    }

    console.log('\n🔧 Setting up environment configuration...')
    
    // Create environment files
    await createEnvironmentFiles()
    
    console.log('\n📦 Installing dependencies...')
    
    // Install root dependencies
    console.log('Installing root dependencies...')
    execSync('npm install', { stdio: 'inherit' })
    
    // Install frontend dependencies
    console.log('Installing frontend dependencies...')
    execSync('cd frontend && npm install', { stdio: 'inherit' })
    
    // Install backend dependencies
    console.log('Installing backend dependencies...')
    execSync('cd backend && npm install', { stdio: 'inherit' })
    
    // Install AI engine dependencies
    console.log('Installing AI engine dependencies (this may take a while)...')
    try {
      execSync('cd ai-engine && pip install -r requirements.txt', { stdio: 'inherit' })
      console.log('✅ AI engine dependencies installed')
    } catch (error) {
      console.log('⚠️ AI engine dependencies failed to install, continuing without AI features')
    }

    console.log('\n🐳 Setting up Docker containers...')
    
    // Start development services
    execSync('docker-compose up -d postgres redis mongo', { stdio: 'inherit' })
    
    // Wait for databases to be ready
    console.log('Waiting for databases to initialize...')
    await sleep(10000)
    
    // Run database migrations
    console.log('Running database migrations...')
    try {
      execSync('cd backend && npm run migrate:up', { stdio: 'inherit' })
      console.log('✅ Database migrations completed')
    } catch (error) {
      console.log('⚠️ Database migrations failed, you may need to run them manually')
    }
    
    // Seed initial data
    console.log('Seeding initial data...')
    try {
      execSync('cd backend && npm run seed', { stdio: 'inherit' })
      console.log('✅ Initial data seeded')
    } catch (error) {
      console.log('⚠️ Data seeding failed, you may need to seed manually')
    }

    console.log('\n✅ Development environment setup complete!')
    console.log('\n🎉 You can now start developing:')
    console.log('   npm run dev          - Start all services in development mode')
    console.log('   npm run dev:frontend - Start only the frontend')
    console.log('   npm run dev:backend  - Start only the backend')
    console.log('   npm run dev:ai       - Start only the AI engine')
    console.log('\n📋 Access URLs:')
    console.log('   Frontend:     http://localhost:3000')
    console.log('   Backend API:  http://localhost:4000')
    console.log('   GraphQL:      http://localhost:4000/graphql')
    console.log('   AI Engine:    http://localhost:8000')
    console.log('   Database:     postgresql://localhost:5432/robolineai')
    console.log('   Redis:        redis://localhost:6379')
    console.log('   MongoDB:      mongodb://localhost:27017/robolineai')
    console.log('\n📚 Documentation:')
    console.log('   Architecture: docs/architecture/system-overview.md')
    console.log('   API Docs:     docs/api/README.md')
    console.log('   User Guide:   docs/user-guide/README.md')

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

async function createEnvironmentFiles() {
  const envConfigs = {
    '.env': {
      NODE_ENV: 'development',
      PORT: '4000',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/robolineai',
      REDIS_URL: 'redis://localhost:6379',
      MONGODB_URI: 'mongodb://localhost:27017/robolineai',
      JWT_SECRET: generateSecret(),
      ENCRYPTION_KEY: generateSecret(),
      AI_ENGINE_URL: 'http://localhost:8000',
      FRONTEND_URL: 'http://localhost:3000',
      // API Keys (user will need to provide)
      OPENAI_API_KEY: 'your-openai-api-key-here',
      GOOGLE_CLOUD_KEY: 'your-google-cloud-key-here',
      AWS_ACCESS_KEY_ID: 'your-aws-access-key-here',
      AWS_SECRET_ACCESS_KEY: 'your-aws-secret-key-here',
    },
    'frontend/.env.local': {
      NEXT_PUBLIC_API_URL: 'http://localhost:4000',
      NEXT_PUBLIC_WS_URL: 'ws://localhost:4000',
      NEXT_PUBLIC_AI_ENGINE_URL: 'http://localhost:8000',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: generateSecret(),
    },
    'backend/.env': {
      NODE_ENV: 'development',
      PORT: '4000',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/robolineai',
      REDIS_URL: 'redis://localhost:6379',
      MONGODB_URI: 'mongodb://localhost:27017/robolineai',
      JWT_SECRET: generateSecret(),
      AI_ENGINE_URL: 'http://localhost:8000',
      FRONTEND_URL: 'http://localhost:3000',
    },
    'ai-engine/.env': {
      PYTHON_ENV: 'development',
      PORT: '8000',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/robolineai',
      REDIS_URL: 'redis://localhost:6379',
      MONGODB_URI: 'mongodb://localhost:27017/robolineai',
      OPENAI_API_KEY: 'your-openai-api-key-here',
      GOOGLE_CLOUD_KEY: 'your-google-cloud-key-here',
      AWS_ACCESS_KEY_ID: 'your-aws-access-key-here',
      AWS_SECRET_ACCESS_KEY: 'your-aws-secret-key-here',
    }
  }

  for (const [filePath, config] of Object.entries(envConfigs)) {
    const fullPath = path.join(process.cwd(), filePath)
    
    if (!fs.existsSync(fullPath)) {
      const envContent = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')
      
      fs.writeFileSync(fullPath, envContent + '\n')
      console.log(`✅ Created ${filePath}`)
    } else {
      console.log(`⏭️ ${filePath} already exists, skipping`)
    }
  }
}

function generateSecret() {
  return require('crypto').randomBytes(32).toString('hex')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error)
  process.exit(1)
})