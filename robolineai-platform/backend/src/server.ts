import 'reflect-metadata'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import dotenv from 'dotenv'
import winston from 'winston'

// Database connections
import { AppDataSource } from './config/database'
import { connectRedis } from './config/redis'
import { connectMongoDB } from './config/mongodb'
import { connectKafka } from './config/kafka'

// GraphQL Resolvers
import { UserResolver } from './resolvers/UserResolver'
import { WorkflowResolver } from './resolvers/WorkflowResolver'
import { BotResolver } from './resolvers/BotResolver'
import { OrganizationResolver } from './resolvers/OrganizationResolver'
import { ProcessResolver } from './resolvers/ProcessResolver'
import { IntegrationResolver } from './resolvers/IntegrationResolver'

// Middleware
import { authMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/logger'

// Routes
import authRoutes from './routes/auth'
import webhookRoutes from './routes/webhooks'
import apiRoutes from './routes/api'

// Services
import { BotOrchestrator } from './services/BotOrchestrator'
import { ProcessMiningService } from './services/ProcessMiningService'
import { AIEngineService } from './services/AIEngineService'

// Socket handlers
import { setupSocketHandlers } from './sockets/handlers'

// Load environment variables
dotenv.config()

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

async function startServer() {
  const app = express()
  const httpServer = createServer(app)
  
  // Socket.IO setup
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  })

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }))

  // CORS configuration
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }))

  // Compression and basic middleware
  app.use(compression())
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true, limit: '50mb' }))

  // Request logging
  app.use(requestLogger)

  // Rate limiting
  if (process.env.REDIS_URL) {
    const redisClient = await connectRedis()
    const rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:',
      points: 1000, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 60, // Block for 60 seconds if limit exceeded
    })

    app.use(async (req, res, next) => {
      try {
        await rateLimiter.consume(req.ip)
        next()
      } catch (rateLimiterRes) {
        res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000) || 1,
        })
      }
    })
  } else {
    // Fallback to basic rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    })
    app.use(limiter)
  }

  try {
    // Initialize database connections
    logger.info('Connecting to databases...')
    await AppDataSource.initialize()
    logger.info('PostgreSQL connected successfully')

    if (process.env.REDIS_URL) {
      await connectRedis()
      logger.info('Redis connected successfully')
    }

    if (process.env.MONGODB_URI) {
      await connectMongoDB()
      logger.info('MongoDB connected successfully')
    }

    if (process.env.KAFKA_BROKERS) {
      await connectKafka()
      logger.info('Kafka connected successfully')
    }

    // Build GraphQL schema
    const schema = await buildSchema({
      resolvers: [
        UserResolver,
        WorkflowResolver,
        BotResolver,
        OrganizationResolver,
        ProcessResolver,
        IntegrationResolver,
      ],
      authChecker: ({ context }) => {
        return !!context.user
      },
    })

    // Create Apollo Server
    const server = new ApolloServer({
      schema,
      context: ({ req, res }) => ({
        req,
        res,
        user: req.user,
        dataSources: {
          // Add data sources here
        },
      }),
      introspection: process.env.NODE_ENV !== 'production',
      plugins: [
        {
          requestDidStart() {
            return {
              willSendResponse(requestContext) {
                logger.info('GraphQL Query', {
                  query: requestContext.request.query,
                  variables: requestContext.request.variables,
                  response: requestContext.response.data,
                })
              },
            }
          },
        },
      ],
    })

    await server.start()

    // Routes
    app.use('/auth', authRoutes)
    app.use('/webhooks', webhookRoutes)
    app.use('/api', authMiddleware, apiRoutes)

    // GraphQL endpoint
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false, // We handle CORS above
    })

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
      })
    })

    // Setup Socket.IO handlers
    setupSocketHandlers(io)

    // Initialize core services
    const botOrchestrator = new BotOrchestrator()
    const processMiningService = new ProcessMiningService()
    const aiEngineService = new AIEngineService()

    // Start background services
    await botOrchestrator.initialize()
    await processMiningService.initialize()
    await aiEngineService.initialize()

    // Error handling middleware (should be last)
    app.use(errorHandler)

    // Start server
    const PORT = process.env.PORT || 4000
    httpServer.listen(PORT, () => {
      logger.info(`🚀 RoboLineAI Server ready!`)
      logger.info(`🌐 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`)
      logger.info(`💬 Socket.IO ready on port ${PORT}`)
      logger.info(`🔧 Environment: ${process.env.NODE_ENV}`)
    })

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`)
      
      httpServer.close(() => {
        logger.info('HTTP server closed')
      })

      try {
        await AppDataSource.destroy()
        logger.info('Database connections closed')
        
        await botOrchestrator.shutdown()
        await processMiningService.shutdown()
        await aiEngineService.shutdown()
        
        logger.info('All services shut down successfully')
        process.exit(0)
      } catch (error) {
        logger.error('Error during shutdown:', error)
        process.exit(1)
      }
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})

startServer()