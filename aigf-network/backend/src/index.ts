import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import chatRoutes from './routes/chat';
import assessmentRoutes from './routes/assessments';
import progressRoutes from './routes/progress';
import personalityRoutes from './routes/personalities';
import scenarioRoutes from './routes/scenarios';
import achievementRoutes from './routes/achievements';
import challengeRoutes from './routes/challenges';
import feedbackRoutes from './routes/feedback';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { authenticateToken } from './middleware/auth';
import { initializeSocketHandlers } from './services/socketService';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`, {
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/assessments', authenticateToken, assessmentRoutes);
app.use('/api/progress', authenticateToken, progressRoutes);
app.use('/api/personalities', authenticateToken, personalityRoutes);
app.use('/api/scenarios', authenticateToken, scenarioRoutes);
app.use('/api/achievements', authenticateToken, achievementRoutes);
app.use('/api/challenges', authenticateToken, challengeRoutes);
app.use('/api/feedback', authenticateToken, feedbackRoutes);

// Socket.io initialization
initializeSocketHandlers(io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.'
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  httpServer.close(() => {
    logger.info('HTTP server closed.');
  });
  
  await prisma.$disconnect();
  logger.info('Database connection closed.');
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info(`🚀 AIGFNetwork Backend Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

export { io };