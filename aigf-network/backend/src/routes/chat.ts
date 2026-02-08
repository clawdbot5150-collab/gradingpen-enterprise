import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { AIService } from '../services/aiService';
import { FeedbackService } from '../services/feedbackService';
import { ProgressService } from '../services/progressService';

const router = express.Router();
const aiService = new AIService();
const feedbackService = new FeedbackService();
const progressService = new ProgressService();

// Get user's chat sessions
router.get('/sessions', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [sessions, totalCount] = await Promise.all([
      prisma.chatSession.findMany({
        where,
        include: {
          scenario: {
            select: { title: true, category: true, difficultyLevel: true }
          },
          personality: {
            select: { name: true, displayName: true, baseType: true }
          },
          feedbackReport: {
            select: { overallRating: true, summary: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.chatSession.count({ where })
    ]);

    res.json({
      sessions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    });

  } catch (error) {
    logger.error('Error fetching chat sessions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch chat sessions'
    });
  }
});

// Start a new chat session
router.post('/sessions', [
  body('scenarioId').optional().isString(),
  body('personalityId').isString().withMessage('Personality ID is required'),
  body('sessionType').optional().isIn(['PRACTICE', 'ASSESSMENT', 'CHALLENGE', 'FREE_TALK', 'GUIDED_LESSON']),
  body('difficultyLevel').optional().isInt({ min: 1, max: 5 }),
  body('duration').optional().isInt({ min: 5, max: 60 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = (req as any).user.id;
    const { scenarioId, personalityId, sessionType = 'PRACTICE', difficultyLevel = 1, duration = 15 } = req.body;

    // Validate personality exists
    const personality = await prisma.aIPersonality.findUnique({
      where: { id: personalityId, isActive: true }
    });

    if (!personality) {
      return res.status(404).json({
        error: 'Personality not found',
        message: 'The specified AI personality does not exist or is inactive'
      });
    }

    // Validate scenario if provided
    let scenario = null;
    if (scenarioId) {
      scenario = await prisma.scenario.findUnique({
        where: { id: scenarioId, isActive: true }
      });

      if (!scenario) {
        return res.status(404).json({
          error: 'Scenario not found',
          message: 'The specified scenario does not exist or is inactive'
        });
      }
    }

    // Check if user has any active sessions (limit concurrent sessions)
    const activeSessions = await prisma.chatSession.count({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });

    if (activeSessions >= 3) {
      return res.status(429).json({
        error: 'Too many active sessions',
        message: 'Please complete or close existing sessions before starting a new one'
      });
    }

    // Create new chat session
    const session = await prisma.chatSession.create({
      data: {
        userId,
        scenarioId,
        personalityId,
        sessionType,
        difficultyLevel,
        duration,
        status: 'ACTIVE'
      },
      include: {
        scenario: true,
        personality: {
          select: {
            id: true,
            name: true,
            displayName: true,
            baseType: true,
            systemPrompt: true,
            conversationStarters: true
          }
        }
      }
    });

    // Generate initial AI message
    const initialMessage = await aiService.generateInitialMessage(session);

    // Save the initial message
    await prisma.message.create({
      data: {
        sessionId: session.id,
        content: initialMessage.content,
        sender: 'AI',
        messageType: 'TEXT',
        sentiment: initialMessage.sentiment,
        confidence: initialMessage.confidence
      }
    });

    logger.info(`New chat session started`, { 
      userId, 
      sessionId: session.id, 
      personalityId, 
      scenarioId 
    });

    res.status(201).json({
      message: 'Chat session started successfully',
      session: {
        ...session,
        initialMessage: initialMessage.content
      }
    });

  } catch (error) {
    logger.error('Error starting chat session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to start chat session'
    });
  }
});

// Send a message in a chat session
router.post('/sessions/:sessionId/messages', [
  param('sessionId').isString(),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message content is required and must be under 2000 characters'),
  body('messageType').optional().isIn(['TEXT', 'AUDIO'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const { content, messageType = 'TEXT' } = req.body;

    // Validate session exists and belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'ACTIVE'
      },
      include: {
        personality: true,
        scenario: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 10 // Get last 10 messages for context
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'Active chat session not found'
      });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        sessionId,
        content,
        sender: 'USER',
        messageType,
        wordCount: content.split(/\s+/).length
      }
    });

    // Update session message count
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        messagesCount: { increment: 1 },
        userWordsCount: { increment: userMessage.wordCount }
      }
    });

    // Generate AI response
    const aiResponse = await aiService.generateResponse({
      session,
      userMessage: content,
      conversationHistory: session.messages.reverse() // Reverse to get chronological order
    });

    // Save AI response
    const aiMessage = await prisma.message.create({
      data: {
        sessionId,
        content: aiResponse.content,
        sender: 'AI',
        messageType: 'TEXT',
        sentiment: aiResponse.sentiment,
        confidence: aiResponse.confidence,
        topics: aiResponse.topics || [],
        emotions: aiResponse.emotions || [],
        wordCount: aiResponse.content.split(/\s+/).length
      }
    });

    // Update session AI message count
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        messagesCount: { increment: 1 },
        aiWordsCount: { increment: aiMessage.wordCount }
      }
    });

    // Generate real-time feedback if enabled
    let feedback = null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true }
    });

    if (user?.preferences?.feedbackFrequency === 'real-time') {
      feedback = await feedbackService.generateRealTimeFeedback({
        sessionId,
        userMessage: content,
        conversationHistory: [...session.messages, userMessage]
      });
    }

    logger.info(`Message exchange completed`, {
      userId,
      sessionId,
      userMessageLength: content.length,
      aiResponseLength: aiResponse.content.length
    });

    res.json({
      message: 'Message sent successfully',
      userMessage,
      aiResponse: aiMessage,
      realTimeFeedback: feedback
    });

  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to send message'
    });
  }
});

// Get messages for a chat session
router.get('/sessions/:sessionId/messages', [
  param('sessionId').isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Validate session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'Chat session not found'
      });
    }

    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.message.count({ where: { sessionId } })
    ]);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    });

  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch messages'
    });
  }
});

// Complete a chat session
router.post('/sessions/:sessionId/complete', [
  param('sessionId').isString(),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('feedback').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const { rating, feedback: userFeedback } = req.body;

    // Validate session
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'ACTIVE'
      },
      include: {
        messages: true,
        personality: true,
        scenario: true
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'Active chat session not found'
      });
    }

    // Calculate actual duration
    const actualDuration = Math.round(
      (new Date().getTime() - session.startedAt.getTime()) / (1000 * 60)
    );

    // Complete the session
    const completedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        actualDuration,
        overallRating: rating
      }
    });

    // Generate comprehensive feedback report
    const feedbackReport = await feedbackService.generateFeedbackReport({
      session: {
        ...session,
        ...completedSession
      },
      messages: session.messages,
      userRating: rating,
      userFeedback
    });

    // Update user progress
    await progressService.updateUserProgress(userId, {
      sessionCompleted: true,
      sessionDuration: actualDuration,
      sessionRating: rating,
      skillsImprovement: feedbackReport.skillsImprovement,
      confidenceGain: feedbackReport.confidenceGain
    });

    logger.info(`Chat session completed`, {
      userId,
      sessionId,
      duration: actualDuration,
      rating,
      messagesCount: session.messages.length
    });

    res.json({
      message: 'Session completed successfully',
      session: completedSession,
      feedbackReport
    });

  } catch (error) {
    logger.error('Error completing chat session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to complete chat session'
    });
  }
});

// Pause a chat session
router.post('/sessions/:sessionId/pause', [
  param('sessionId').isString()
], async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'ACTIVE'
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'Active chat session not found'
      });
    }

    const pausedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'PAUSED' }
    });

    res.json({
      message: 'Session paused successfully',
      session: pausedSession
    });

  } catch (error) {
    logger.error('Error pausing chat session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to pause chat session'
    });
  }
});

// Resume a paused chat session
router.post('/sessions/:sessionId/resume', [
  param('sessionId').isString()
], async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'PAUSED'
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'Paused chat session not found'
      });
    }

    const resumedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'ACTIVE' }
    });

    res.json({
      message: 'Session resumed successfully',
      session: resumedSession
    });

  } catch (error) {
    logger.error('Error resuming chat session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resume chat session'
    });
  }
});

export default router;