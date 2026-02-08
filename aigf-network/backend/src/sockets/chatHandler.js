const DatabaseService = require('../services/DatabaseService');
const AIService = require('../services/AIService');
const logger = require('../utils/logger');

/**
 * Chat Socket Handler
 * Handles real-time chat functionality with AI personalities
 */
function chatSocketHandler(io, socket) {
  const userId = socket.userId;

  /**
   * Start a new chat session
   */
  socket.on('start_chat_session', async (data) => {
    try {
      const {
        aiPersonalityId,
        practiceScenarioId = null,
        sessionType = 'free_chat',
        title = null,
        difficultyLevel = 'beginner'
      } = data;

      // Validate AI personality exists
      const personality = await DatabaseService.getAIPersonality(aiPersonalityId);
      if (!personality) {
        socket.emit('error', {
          type: 'invalid_personality',
          message: 'Selected AI personality not found'
        });
        return;
      }

      // Validate practice scenario if provided
      let scenario = null;
      if (practiceScenarioId) {
        scenario = await DatabaseService.getPracticeScenario(practiceScenarioId);
        if (!scenario) {
          socket.emit('error', {
            type: 'invalid_scenario',
            message: 'Selected practice scenario not found'
          });
          return;
        }
      }

      // Create new chat session
      const sessionData = {
        userId,
        aiPersonalityId,
        practiceScenarioId,
        sessionType,
        title: title || `Chat with ${personality.name}`,
        difficultyLevel
      };

      const session = await DatabaseService.createChatSession(sessionData);

      // Join session room
      socket.join(`session_${session.id}`);

      // Get user progress for context
      const userProgress = await DatabaseService.getUserProgress(userId);

      // Generate initial AI greeting if it's a practice scenario
      let initialMessage = null;
      if (scenario) {
        const greeting = await AIService.generateResponse({
          personalityId: aiPersonalityId,
          userMessage: 'Start the practice scenario',
          conversationHistory: [],
          practiceScenario: scenario,
          userProgress,
          difficultyLevel,
          sessionMetadata: { userId, sessionId: session.id }
        });

        // Save AI greeting message
        const messageData = {
          sessionId: session.id,
          messageType: 'ai',
          content: greeting.response,
          aiPersonalityId,
          responseTimeMs: greeting.responseTimeMs,
          confidenceScore: greeting.analysis.confidenceScore,
          sentimentScore: greeting.analysis.sentimentScore,
          engagementScore: greeting.analysis.engagementScore
        };

        initialMessage = await DatabaseService.createMessage(messageData);
      }

      // Emit session started event
      socket.emit('chat_session_started', {
        session: {
          id: session.id,
          title: session.title,
          aiPersonality: {
            id: personality.id,
            name: personality.name,
            type: personality.type,
            avatar: personality.avatar_url
          },
          practiceScenario: scenario ? {
            id: scenario.id,
            title: scenario.title,
            category: scenario.category,
            objectives: scenario.objectives
          } : null,
          sessionType: session.session_type,
          difficultyLevel: session.difficulty_level,
          startedAt: session.started_at
        },
        initialMessage: initialMessage ? {
          id: initialMessage.id,
          content: initialMessage.content,
          timestamp: initialMessage.timestamp,
          type: 'ai'
        } : null
      });

      logger.info(`Chat session started: ${session.id} for user ${userId}`);

    } catch (error) {
      logger.error('Start chat session error:', error);
      socket.emit('error', {
        type: 'session_start_error',
        message: 'Failed to start chat session'
      });
    }
  });

  /**
   * Send a message in the chat
   */
  socket.on('send_message', async (data) => {
    try {
      const {
        sessionId,
        message,
        messageType = 'user'
      } = data;

      if (!message || !message.trim()) {
        socket.emit('error', {
          type: 'empty_message',
          message: 'Message cannot be empty'
        });
        return;
      }

      // Get session details
      const session = await DatabaseService.getChatSession(sessionId);
      if (!session || session.user_id !== userId) {
        socket.emit('error', {
          type: 'invalid_session',
          message: 'Chat session not found or access denied'
        });
        return;
      }

      if (session.is_completed) {
        socket.emit('error', {
          type: 'session_completed',
          message: 'This chat session has already been completed'
        });
        return;
      }

      // Save user message
      const userMessageData = {
        sessionId,
        messageType: 'user',
        content: message.trim(),
        senderId: userId
      };

      const userMessage = await DatabaseService.createMessage(userMessageData);

      // Emit user message to all clients in the session
      io.to(`session_${sessionId}`).emit('message_received', {
        id: userMessage.id,
        sessionId,
        content: userMessage.content,
        type: 'user',
        sender: {
          id: userId,
          username: socket.user?.username || 'User'
        },
        timestamp: userMessage.timestamp
      });

      // Check for crisis indicators
      const crisisIndicators = AIService.detectCrisisIndicators(message);
      if (crisisIndicators.length > 0) {
        // Log crisis detection
        await DatabaseService.query(`
          INSERT INTO crisis_detection_logs (user_id, session_id, message_id, crisis_indicators, confidence_level)
          VALUES ($1, $2, $3, $4, $5)
        `, [userId, sessionId, userMessage.id, JSON.stringify(crisisIndicators), 0.8]);

        // Send mental health resources
        socket.emit('mental_health_alert', {
          message: 'It seems like you might be going through a difficult time. Here are some resources that might help.',
          resources: await getMentalHealthResources()
        });
      }

      // Generate AI response
      const conversationHistory = await DatabaseService.getSessionMessages(sessionId, 20);
      const userProgress = await DatabaseService.getUserProgress(userId);
      const practiceScenario = session.practice_scenario_id 
        ? await DatabaseService.getPracticeScenario(session.practice_scenario_id)
        : null;

      // Emit typing indicator
      socket.to(`session_${sessionId}`).emit('ai_typing', { typing: true });

      const aiResponse = await AIService.generateResponse({
        personalityId: session.ai_personality_id,
        userMessage: message,
        conversationHistory: conversationHistory.slice(-10), // Last 10 messages
        practiceScenario,
        userProgress,
        difficultyLevel: session.difficulty_level,
        sessionMetadata: { userId, sessionId }
      });

      // Save AI response message
      const aiMessageData = {
        sessionId,
        messageType: 'ai',
        content: aiResponse.response,
        aiPersonalityId: session.ai_personality_id,
        responseTimeMs: aiResponse.responseTimeMs,
        confidenceScore: aiResponse.analysis.confidenceScore,
        sentimentScore: aiResponse.analysis.sentimentScore,
        engagementScore: aiResponse.analysis.engagementScore
      };

      const aiMessage = await DatabaseService.createMessage(aiMessageData);

      // Stop typing indicator
      socket.to(`session_${sessionId}`).emit('ai_typing', { typing: false });

      // Emit AI response
      io.to(`session_${sessionId}`).emit('message_received', {
        id: aiMessage.id,
        sessionId,
        content: aiMessage.content,
        type: 'ai',
        aiPersonality: {
          id: session.ai_personality_id,
          name: session.ai_name,
          type: session.ai_type
        },
        timestamp: aiMessage.timestamp,
        analysis: {
          confidenceScore: aiResponse.analysis.confidenceScore,
          sentimentScore: aiResponse.analysis.sentimentScore,
          engagementScore: aiResponse.analysis.engagementScore
        }
      });

      // Update user progress based on conversation
      await updateUserProgressFromMessage(userId, userMessage, aiResponse.analysis);

      logger.info(`Message exchange completed for session ${sessionId}`);

    } catch (error) {
      logger.error('Send message error:', error);
      socket.emit('error', {
        type: 'message_error',
        message: 'Failed to send message'
      });
    }
  });

  /**
   * End chat session
   */
  socket.on('end_chat_session', async (data) => {
    try {
      const { sessionId, userRating = null, feedback = null } = data;

      // Get session
      const session = await DatabaseService.getChatSession(sessionId);
      if (!session || session.user_id !== userId) {
        socket.emit('error', {
          type: 'invalid_session',
          message: 'Chat session not found or access denied'
        });
        return;
      }

      if (session.is_completed) {
        socket.emit('error', {
          type: 'already_completed',
          message: 'Session already completed'
        });
        return;
      }

      // Calculate session duration
      const endTime = new Date();
      const startTime = new Date(session.started_at);
      const durationMinutes = Math.round((endTime - startTime) / 60000);

      // Update session as completed
      const updatedSession = await DatabaseService.updateChatSession(sessionId, {
        ended_at: endTime,
        duration_minutes: durationMinutes,
        is_completed: true,
        user_satisfaction_rating: userRating,
        completion_percentage: 100.0,
        session_metadata: {
          feedback,
          endedByUser: true
        }
      });

      // Generate conversation analysis
      const messages = await DatabaseService.getSessionMessages(sessionId);
      const userProgress = await DatabaseService.getUserProgress(userId);

      if (messages.length > 2) { // Only analyze if there was actual conversation
        try {
          const analysis = await AIService.generateConversationAnalysis(
            sessionId,
            messages,
            userProgress
          );

          // Save session analytics
          const analyticsData = {
            sessionId,
            userId,
            analysisData: analysis,
            confidenceMetrics: {
              overallGrowth: analysis.overallConfidenceGrowth,
              qualityScores: analysis.conversationQuality
            },
            conversationQuality: analysis.conversationQuality,
            improvementSuggestions: analysis.actionableAdvice,
            strengthsIdentified: analysis.strengthsIdentified,
            areasToWorkOn: analysis.improvementAreas,
            aiPerformanceMetrics: {
              averageResponseTime: messages
                .filter(m => m.message_type === 'ai' && m.response_time_ms)
                .reduce((sum, m) => sum + m.response_time_ms, 0) / messages.filter(m => m.message_type === 'ai').length || 0,
              averageConfidenceScore: messages
                .filter(m => m.message_type === 'ai' && m.confidence_score)
                .reduce((sum, m) => sum + m.confidence_score, 0) / messages.filter(m => m.message_type === 'ai').length || 0
            }
          };

          await DatabaseService.createSessionAnalytics(analyticsData);

          // Update user progress
          await updateUserProgressFromSession(userId, analysis, durationMinutes);

          // Emit session analysis
          socket.emit('session_analysis', {
            sessionId,
            analysis: {
              overallGrowth: analysis.overallConfidenceGrowth,
              conversationQuality: analysis.conversationQuality,
              strengths: analysis.strengthsIdentified,
              improvementAreas: analysis.improvementAreas,
              feedback: analysis.specificFeedback,
              actionableAdvice: analysis.actionableAdvice,
              nextSteps: analysis.nextSteps
            },
            sessionStats: {
              duration: durationMinutes,
              messageCount: messages.length,
              completionPercentage: 100
            }
          });

        } catch (analysisError) {
          logger.error('Session analysis failed:', analysisError);
        }
      }

      // Leave session room
      socket.leave(`session_${sessionId}`);

      // Emit session completed
      socket.emit('chat_session_ended', {
        sessionId,
        duration: durationMinutes,
        messageCount: session.message_count,
        rating: userRating
      });

      logger.info(`Chat session ended: ${sessionId} (${durationMinutes} minutes)`);

    } catch (error) {
      logger.error('End chat session error:', error);
      socket.emit('error', {
        type: 'session_end_error',
        message: 'Failed to end chat session'
      });
    }
  });

  /**
   * Get session history
   */
  socket.on('get_session_history', async (data) => {
    try {
      const { sessionId, limit = 50, offset = 0 } = data;

      // Verify session access
      const session = await DatabaseService.getChatSession(sessionId);
      if (!session || session.user_id !== userId) {
        socket.emit('error', {
          type: 'access_denied',
          message: 'Access denied to session history'
        });
        return;
      }

      const messages = await DatabaseService.getSessionMessages(sessionId, limit, offset);

      socket.emit('session_history', {
        sessionId,
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          type: msg.message_type,
          timestamp: msg.timestamp,
          sender: msg.message_type === 'user' ? {
            id: msg.sender_id,
            username: msg.username
          } : {
            id: msg.ai_personality_id,
            name: msg.ai_name
          },
          analysis: msg.message_type === 'ai' ? {
            confidenceScore: msg.confidence_score,
            sentimentScore: msg.sentiment_score,
            engagementScore: msg.engagement_score
          } : null
        }))
      });

    } catch (error) {
      logger.error('Get session history error:', error);
      socket.emit('error', {
        type: 'history_error',
        message: 'Failed to get session history'
      });
    }
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    logger.debug(`User ${userId} disconnected from chat`);
  });
}

/**
 * Update user progress based on individual message
 */
async function updateUserProgressFromMessage(userId, message, analysis) {
  try {
    const currentProgress = await DatabaseService.getUserProgress(userId);
    
    if (currentProgress) {
      // Small incremental updates based on message quality
      const confidenceIncrease = analysis.confidenceScore * 0.1;
      const engagementBonus = analysis.engagementScore > 0.7 ? 0.05 : 0;
      
      const updates = {
        overall_confidence_score: Math.min(100, 
          (currentProgress.overall_confidence_score || 0) + confidenceIncrease + engagementBonus
        ),
        experience_points: (currentProgress.experience_points || 0) + 1,
        last_activity: new Date()
      };

      await DatabaseService.updateUserProgress(userId, updates);
    }
  } catch (error) {
    logger.error('Failed to update user progress from message:', error);
  }
}

/**
 * Update user progress based on completed session
 */
async function updateUserProgressFromSession(userId, analysis, durationMinutes) {
  try {
    const currentProgress = await DatabaseService.getUserProgress(userId);
    
    if (currentProgress) {
      const updates = {
        overall_confidence_score: Math.min(100,
          (currentProgress.overall_confidence_score || 0) + (analysis.overallConfidenceGrowth || 0)
        ),
        sessions_completed: (currentProgress.sessions_completed || 0) + 1,
        total_practice_time_minutes: (currentProgress.total_practice_time_minutes || 0) + durationMinutes,
        experience_points: (currentProgress.experience_points || 0) + Math.round(durationMinutes * 0.5),
        strengths: analysis.strengthsIdentified || [],
        improvement_areas: analysis.improvementAreas || [],
        last_activity: new Date()
      };

      // Level up logic
      const newXP = updates.experience_points;
      const newLevel = Math.floor(newXP / 100) + 1;
      if (newLevel > (currentProgress.current_level || 1)) {
        updates.current_level = newLevel;
      }

      await DatabaseService.updateUserProgress(userId, updates);
    }
  } catch (error) {
    logger.error('Failed to update user progress from session:', error);
  }
}

/**
 * Get mental health resources
 */
async function getMentalHealthResources() {
  try {
    const resources = await DatabaseService.query(`
      SELECT title, description, url, contact_info, is_emergency
      FROM mental_health_resources
      WHERE is_active = true
      ORDER BY is_emergency DESC, title
      LIMIT 5
    `);

    return resources.rows;
  } catch (error) {
    logger.error('Failed to get mental health resources:', error);
    return [];
  }
}

module.exports = chatSocketHandler;