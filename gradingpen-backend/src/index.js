require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');

// Import routes
const authRoutes = require('./routes/auth');
const gradingRoutes = require('./routes/grading');
const analyticsRoutes = require('./routes/analytics');
const rubricsRoutes = require('./routes/rubrics');
const assignmentsRoutes = require('./routes/assignments');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import database connection
const db = require('./config/database');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/grading', authMiddleware, gradingRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/rubrics', authMiddleware, rubricsRoutes);
app.use('/api/assignments', authMiddleware, assignmentsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`GradingPen server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;