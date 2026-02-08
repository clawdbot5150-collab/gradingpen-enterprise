import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import videoRoutes from './routes/videos';
import templateRoutes from './routes/templates';
import brandKitRoutes from './routes/brand-kits';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import subscriptionRoutes from './routes/subscriptions';
import webhookRoutes from './routes/webhooks';
import uploadRoutes from './routes/uploads';
import projectRoutes from './routes/projects';

// Import middleware
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { authMiddleware } from './middleware/auth';
import { requestLogger } from './middleware/request-logger';

// Import services
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { initializeQueues } from './config/queues';
import { initializeStorage } from './config/storage';
import { setupWebSockets } from './websocket';
import { logger } from './utils/logger';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/videos', authMiddleware, videoRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/brand-kits', authMiddleware, brandKitRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/subscriptions', authMiddleware, subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/uploads', authMiddleware, uploadRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

// Initialize services
async function initializeServices() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Initialize Redis
    await initializeRedis();
    logger.info('Redis initialized');

    // Initialize queues
    await initializeQueues();
    logger.info('Job queues initialized');

    // Initialize storage
    await initializeStorage();
    logger.info('Storage initialized');

    // Setup WebSocket handlers
    setupWebSockets(io);
    logger.info('WebSocket server initialized');

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  await initializeServices();
  
  server.listen(PORT, () => {
    logger.info(`🚀 AIVideoBuddy Backend Server running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔌 WebSocket server running on port ${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export { app, io };