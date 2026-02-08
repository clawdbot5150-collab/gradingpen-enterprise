import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from './utils/logger';
import { prisma } from './config/database';

export function setupWebSockets(io: SocketIOServer): void {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, username: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('Invalid user'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      logger.warn('WebSocket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(`User ${user.id} connected via WebSocket`);

    // Join user-specific room
    socket.join(`user_${user.id}`);

    // Handle ping-pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle video generation progress subscriptions
    socket.on('subscribe_video_progress', (videoId: string) => {
      socket.join(`video_${videoId}`);
      logger.debug(`User ${user.id} subscribed to video ${videoId} progress`);
    });

    socket.on('unsubscribe_video_progress', (videoId: string) => {
      socket.leave(`video_${videoId}`);
      logger.debug(`User ${user.id} unsubscribed from video ${videoId} progress`);
    });

    // Handle project collaboration
    socket.on('join_project', (projectId: string) => {
      socket.join(`project_${projectId}`);
      socket.to(`project_${projectId}`).emit('user_joined_project', {
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('leave_project', (projectId: string) => {
      socket.leave(`project_${projectId}`);
      socket.to(`project_${projectId}`).emit('user_left_project', {
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle real-time project updates
    socket.on('project_update', (data: { projectId: string; changes: any }) => {
      socket.to(`project_${data.projectId}`).emit('project_updated', {
        userId: user.id,
        username: user.username,
        changes: data.changes,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle cursor position for collaboration
    socket.on('cursor_position', (data: { projectId: string; x: number; y: number }) => {
      socket.to(`project_${data.projectId}`).emit('cursor_position', {
        userId: user.id,
        username: user.username,
        x: data.x,
        y: data.y,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User ${user.id} disconnected: ${reason}`);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to AIVideoBuddy',
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
  });

  // Global event emitters for the application
  setupGlobalEventEmitters(io);
}

function setupGlobalEventEmitters(io: SocketIOServer): void {
  // These functions can be used throughout the application to emit events

  // Video generation progress
  global.emitVideoProgress = (userId: string, videoId: string, progress: number, stage: string) => {
    io.to(`user_${userId}`).to(`video_${videoId}`).emit('video_progress', {
      videoId,
      progress,
      stage,
      timestamp: new Date().toISOString(),
    });
  };

  // Video generation completed
  global.emitVideoCompleted = (userId: string, videoId: string, result: any) => {
    io.to(`user_${userId}`).to(`video_${videoId}`).emit('video_completed', {
      videoId,
      result,
      timestamp: new Date().toISOString(),
    });
  };

  // Video generation failed
  global.emitVideoFailed = (userId: string, videoId: string, error: string) => {
    io.to(`user_${userId}`).to(`video_${videoId}`).emit('video_failed', {
      videoId,
      error,
      timestamp: new Date().toISOString(),
    });
  };

  // Credits low warning
  global.emitCreditsLow = (userId: string, currentCredits: number, threshold: number) => {
    io.to(`user_${userId}`).emit('credits_low', {
      currentCredits,
      threshold,
      timestamp: new Date().toISOString(),
    });
  };

  // Subscription expired
  global.emitSubscriptionExpired = (userId: string) => {
    io.to(`user_${userId}`).emit('subscription_expired', {
      timestamp: new Date().toISOString(),
    });
  };

  // General notification
  global.emitNotification = (userId: string, notification: any) => {
    io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  };

  // Broadcast to all connected users
  global.emitBroadcast = (event: string, data: any) => {
    io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  };
}

// Type definitions for global event emitters
declare global {
  var emitVideoProgress: (userId: string, videoId: string, progress: number, stage: string) => void;
  var emitVideoCompleted: (userId: string, videoId: string, result: any) => void;
  var emitVideoFailed: (userId: string, videoId: string, error: string) => void;
  var emitCreditsLow: (userId: string, currentCredits: number, threshold: number) => void;
  var emitSubscriptionExpired: (userId: string) => void;
  var emitNotification: (userId: string, notification: any) => void;
  var emitBroadcast: (event: string, data: any) => void;
}