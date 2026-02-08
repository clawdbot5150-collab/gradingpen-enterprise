const { Pool } = require('pg');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'aigf_network',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isInitialized = true;
      logger.info('Database connection pool initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Execute a query with parameters
   */
  async query(text, params = []) {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
      }
      
      return result;
    } catch (error) {
      logger.error('Database query error:', { query: text, params, error: error.message });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * User-related queries
   */
  async createUser(userData) {
    const {
      email,
      passwordHash,
      username,
      firstName,
      lastName,
      dateOfBirth,
      timezone,
      goals = [],
      preferences = {}
    } = userData;

    const query = `
      INSERT INTO users (
        email, password_hash, username, first_name, last_name,
        date_of_birth, timezone, goals, preferences
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, username, first_name, last_name, created_at
    `;

    const result = await this.query(query, [
      email, passwordHash, username, firstName, lastName,
      dateOfBirth, timezone, goals, JSON.stringify(preferences)
    ]);

    return result.rows[0];
  }

  async findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
    const result = await this.query(query, [email]);
    return result.rows[0];
  }

  async findUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async updateUser(userId, updates) {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Chat session queries
   */
  async createChatSession(sessionData) {
    const {
      userId,
      aiPersonalityId,
      practiceScenarioId,
      sessionType,
      title,
      difficultyLevel
    } = sessionData;

    const query = `
      INSERT INTO chat_sessions (
        user_id, ai_personality_id, practice_scenario_id,
        session_type, title, difficulty_level
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await this.query(query, [
      userId, aiPersonalityId, practiceScenarioId,
      sessionType, title, difficultyLevel
    ]);

    return result.rows[0];
  }

  async updateChatSession(sessionId, updates) {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    values.push(sessionId);
    const query = `
      UPDATE chat_sessions 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getChatSession(sessionId) {
    const query = `
      SELECT cs.*, ap.name as ai_name, ap.type as ai_type,
             ps.title as scenario_title, ps.category as scenario_category
      FROM chat_sessions cs
      LEFT JOIN ai_personalities ap ON cs.ai_personality_id = ap.id
      LEFT JOIN practice_scenarios ps ON cs.practice_scenario_id = ps.id
      WHERE cs.id = $1
    `;
    
    const result = await this.query(query, [sessionId]);
    return result.rows[0];
  }

  async getUserChatSessions(userId, limit = 20, offset = 0) {
    const query = `
      SELECT cs.*, ap.name as ai_name, ps.title as scenario_title
      FROM chat_sessions cs
      LEFT JOIN ai_personalities ap ON cs.ai_personality_id = ap.id
      LEFT JOIN practice_scenarios ps ON cs.practice_scenario_id = ps.id
      WHERE cs.user_id = $1
      ORDER BY cs.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Chat message queries
   */
  async createMessage(messageData) {
    const {
      sessionId,
      messageType,
      content,
      senderId,
      aiPersonalityId,
      messageMetadata = {},
      responseTimeMs,
      confidenceScore,
      sentimentScore,
      engagementScore
    } = messageData;

    const query = `
      INSERT INTO chat_messages (
        session_id, message_type, content, sender_id, ai_personality_id,
        message_metadata, response_time_ms, confidence_score,
        sentiment_score, engagement_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await this.query(query, [
      sessionId, messageType, content, senderId, aiPersonalityId,
      JSON.stringify(messageMetadata), responseTimeMs, confidenceScore,
      sentimentScore, engagementScore
    ]);

    // Update session message count
    await this.query(
      'UPDATE chat_sessions SET message_count = message_count + 1 WHERE id = $1',
      [sessionId]
    );

    return result.rows[0];
  }

  async getSessionMessages(sessionId, limit = 100, offset = 0) {
    const query = `
      SELECT cm.*, u.username, ap.name as ai_name
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      LEFT JOIN ai_personalities ap ON cm.ai_personality_id = ap.id
      WHERE cm.session_id = $1 AND cm.deleted_at IS NULL
      ORDER BY cm.timestamp ASC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.query(query, [sessionId, limit, offset]);
    return result.rows;
  }

  /**
   * AI Personalities queries
   */
  async getAIPersonalities() {
    const query = 'SELECT * FROM ai_personalities WHERE is_active = true ORDER BY name';
    const result = await this.query(query);
    return result.rows;
  }

  async getAIPersonality(id) {
    const query = 'SELECT * FROM ai_personalities WHERE id = $1 AND is_active = true';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Practice Scenarios queries
   */
  async getPracticeScenarios(category = null, difficulty = null) {
    let query = 'SELECT * FROM practice_scenarios WHERE is_active = true';
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    query += ' ORDER BY difficulty, title';
    
    const result = await this.query(query, params);
    return result.rows;
  }

  async getPracticeScenario(id) {
    const query = 'SELECT * FROM practice_scenarios WHERE id = $1 AND is_active = true';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  /**
   * User Progress queries
   */
  async getUserProgress(userId) {
    const query = 'SELECT * FROM user_progress WHERE user_id = $1';
    const result = await this.query(query, [userId]);
    return result.rows[0];
  }

  async updateUserProgress(userId, progressData) {
    const existingProgress = await this.getUserProgress(userId);
    
    if (existingProgress) {
      // Update existing progress
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(progressData).forEach(key => {
        if (key !== 'user_id') {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(progressData[key]);
          paramIndex++;
        }
      });

      values.push(userId);
      const query = `
        UPDATE user_progress 
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.query(query, values);
      return result.rows[0];
    } else {
      // Create new progress record
      const query = `
        INSERT INTO user_progress (user_id, ${Object.keys(progressData).join(', ')})
        VALUES ($1, ${Object.keys(progressData).map((_, i) => `$${i + 2}`).join(', ')})
        RETURNING *
      `;

      const result = await this.query(query, [userId, ...Object.values(progressData)]);
      return result.rows[0];
    }
  }

  /**
   * Analytics queries
   */
  async createSessionAnalytics(analyticsData) {
    const {
      sessionId,
      userId,
      analysisData,
      confidenceMetrics,
      conversationQuality,
      improvementSuggestions,
      strengthsIdentified,
      areasToWorkOn,
      aiPerformanceMetrics
    } = analyticsData;

    const query = `
      INSERT INTO session_analytics (
        session_id, user_id, analysis_data, confidence_metrics,
        conversation_quality, improvement_suggestions, strengths_identified,
        areas_to_work_on, ai_performance_metrics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.query(query, [
      sessionId, userId,
      JSON.stringify(analysisData),
      JSON.stringify(confidenceMetrics),
      JSON.stringify(conversationQuality),
      improvementSuggestions,
      strengthsIdentified,
      areasToWorkOn,
      JSON.stringify(aiPerformanceMetrics)
    ]);

    return result.rows[0];
  }

  /**
   * Close database connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isInitialized = false;
      logger.info('Database connection pool closed');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as healthy, NOW() as timestamp');
      return {
        healthy: true,
        timestamp: result.rows[0].timestamp,
        connectionCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();