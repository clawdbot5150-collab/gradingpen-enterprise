require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const practiceRoutes = require('./routes/practice');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

// Import socket handlers
const chatSocketHandler = require('./sockets/chatHandler');
const practiceSocketHandler = require('./sockets/practiceHandler');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const validationMiddleware = require('./middleware/validation');

// Import services
const DatabaseService = require('./services/DatabaseService');
const AIService = require('./services/AIService');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure properly for production
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
} else {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/practice', authMiddleware, practiceRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.user = decoded;
      next();
    } catch (err) {
      logger.error('Socket authentication error:', err);
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.userId}`);
  
  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  
  // Register socket handlers
  chatSocketHandler(io, socket);
  practiceSocketHandler(io, socket);
  
  // Handle user status updates
  socket.on('user_status', (status) => {
    socket.broadcast.emit('user_status_update', {
      userId: socket.userId,
      status: status
    });
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: socket.userId,
      typing: true
    });
  });
  
  socket.on('typing_stop', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: socket.userId,
      typing: false
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.userId}`);
    socket.broadcast.emit('user_status_update', {
      userId: socket.userId,
      status: 'offline'
    });
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Initialize database and services
async function initializeServer() {
  try {
    // Initialize database connection
    await DatabaseService.initialize();
    logger.info('Database connection established');
    
    // Initialize AI service
    await AIService.initialize();
    logger.info('AI service initialized');
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 AIGFNetwork Backend Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 Socket.IO ready for connections`);
    });
    
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  await DatabaseService.close();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close database connections
  await DatabaseService.close();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize and start server
initializeServer();

module.exports = { app, server, io };