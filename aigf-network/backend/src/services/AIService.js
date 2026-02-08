const OpenAI = require('openai');
const DatabaseService = require('./DatabaseService');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.openai = null;
    this.personalities = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize AI service
   */
  async initialize() {
    try {
      // Initialize OpenAI client
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      // Load AI personalities from database
      await this.loadPersonalities();

      this.isInitialized = true;
      logger.info('AI Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI service:', error);
      throw error;
    }
  }

  /**
   * Load AI personalities from database
   */
  async loadPersonalities() {
    try {
      const personalities = await DatabaseService.getAIPersonalities();
      
      personalities.forEach(personality => {
        this.personalities.set(personality.id, {
          ...personality,
          personality_traits: typeof personality.personality_traits === 'string' 
            ? JSON.parse(personality.personality_traits) 
            : personality.personality_traits,
          conversation_style: typeof personality.conversation_style === 'string'
            ? JSON.parse(personality.conversation_style)
            : personality.conversation_style,
          difficulty_adaptation: typeof personality.difficulty_adaptation === 'string'
            ? JSON.parse(personality.difficulty_adaptation)
            : personality.difficulty_adaptation
        });
      });

      logger.info(`Loaded ${personalities.length} AI personalities`);
    } catch (error) {
      logger.error('Failed to load AI personalities:', error);
      throw error;
    }
  }

  /**
   * Generate AI response for a conversation
   */
  async generateResponse(options) {
    const {
      personalityId,
      userMessage,
      conversationHistory = [],
      practiceScenario = null,
      userProgress = null,
      difficultyLevel = 'beginner',
      sessionMetadata = {}
    } = options;

    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    const personality = this.personalities.get(personalityId);
    if (!personality) {
      throw new Error(`Personality ${personalityId} not found`);
    }

    try {
      const startTime = Date.now();

      // Build conversation context
      const systemPrompt = this.buildSystemPrompt(personality, practiceScenario, userProgress, difficultyLevel);
      const messages = this.buildConversationMessages(systemPrompt, conversationHistory, userMessage);

      // Generate response with OpenAI
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: messages,
        max_tokens: 500,
        temperature: personality.conversation_style.creativity || 0.7,
        presence_penalty: personality.conversation_style.engagement || 0.1,
        frequency_penalty: personality.conversation_style.variety || 0.1,
        user: sessionMetadata.userId || 'anonymous'
      });

      const responseTime = Date.now() - startTime;
      const aiResponse = completion.choices[0].message.content;

      // Analyze the response for metrics
      const analysis = await this.analyzeResponse(userMessage, aiResponse, personality, difficultyLevel);

      return {
        response: aiResponse,
        responseTimeMs: responseTime,
        analysis: analysis,
        tokenUsage: completion.usage,
        personality: {
          id: personality.id,
          name: personality.name,
          type: personality.type
        }
      };

    } catch (error) {
      logger.error('Failed to generate AI response:', error);
      throw new Error(`AI response generation failed: ${error.message}`);
    }
  }

  /**
   * Build system prompt based on personality and context
   */
  buildSystemPrompt(personality, practiceScenario, userProgress, difficultyLevel) {
    let systemPrompt = personality.system_prompt;

    // Add personality-specific traits
    const traits = personality.personality_traits;
    systemPrompt += `\n\nPersonality Traits: ${Object.entries(traits)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')}`;

    // Add conversation style guidelines
    const style = personality.conversation_style;
    systemPrompt += `\n\nConversation Style: ${Object.entries(style)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')}`;

    // Add practice scenario context if available
    if (practiceScenario) {
      systemPrompt += `\n\nPractice Scenario: ${practiceScenario.title}`;
      systemPrompt += `\nScenario Context: ${practiceScenario.description}`;
      systemPrompt += `\nObjectives: ${practiceScenario.objectives.join(', ')}`;
      systemPrompt += `\n\nScenario Setup: ${practiceScenario.setup_prompt}`;
    }

    // Add user progress context if available
    if (userProgress) {
      systemPrompt += `\n\nUser Progress Context:`;
      systemPrompt += `\nConfidence Level: ${userProgress.overall_confidence_score}/100`;
      systemPrompt += `\nCurrent Level: ${userProgress.current_level}`;
      if (userProgress.strengths && userProgress.strengths.length > 0) {
        systemPrompt += `\nStrengths: ${userProgress.strengths.join(', ')}`;
      }
      if (userProgress.improvement_areas && userProgress.improvement_areas.length > 0) {
        systemPrompt += `\nAreas to Improve: ${userProgress.improvement_areas.join(', ')}`;
      }
    }

    // Add difficulty-specific adaptations
    const adaptations = personality.difficulty_adaptation;
    if (adaptations[difficultyLevel]) {
      systemPrompt += `\n\nDifficulty Adaptations for ${difficultyLevel}: ${adaptations[difficultyLevel]}`;
    }

    // Add ethical guidelines
    systemPrompt += `\n\nEthical Guidelines:
- Always maintain a supportive and non-judgmental tone
- Encourage healthy relationship behaviors and boundaries
- If the user expresses concerning thoughts, gently suggest professional help
- Focus on building genuine confidence, not manipulation
- Respect the user's comfort level and pace
- Promote consent and mutual respect in all interactions
- Avoid reinforcing harmful stereotypes or behaviors`;

    // Add crisis detection instructions
    systemPrompt += `\n\nCrisis Detection:
- Be alert for signs of depression, anxiety, or suicidal thoughts
- If detected, respond with empathy and provide mental health resources
- Encourage professional help when appropriate
- Never provide medical or therapeutic advice beyond encouragement`;

    return systemPrompt;
  }

  /**
   * Build conversation messages array for OpenAI
   */
  buildConversationMessages(systemPrompt, conversationHistory, userMessage) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last 10 messages to stay within token limits)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(message => {
      if (message.message_type === 'user') {
        messages.push({ role: 'user', content: message.content });
      } else if (message.message_type === 'ai') {
        messages.push({ role: 'assistant', content: message.content });
      }
    });

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Analyze response for various metrics
   */
  async analyzeResponse(userMessage, aiResponse, personality, difficultyLevel) {
    try {
      // Sentiment analysis
      const sentimentScore = this.analyzeSentiment(aiResponse);
      
      // Engagement analysis
      const engagementScore = this.analyzeEngagement(aiResponse);
      
      // Confidence building potential
      const confidenceScore = this.analyzeConfidenceBuilding(aiResponse, personality.type);
      
      // Difficulty appropriateness
      const difficultyAppropriate = this.analyzeDifficultyMatch(aiResponse, difficultyLevel);
      
      // Educational value
      const educationalValue = this.analyzeEducationalValue(aiResponse);
      
      // Crisis indicators
      const crisisIndicators = this.detectCrisisIndicators(userMessage);

      return {
        sentimentScore,
        engagementScore,
        confidenceScore,
        difficultyAppropriate,
        educationalValue,
        crisisIndicators,
        responseLength: aiResponse.length,
        wordCount: aiResponse.split(' ').length
      };
    } catch (error) {
      logger.error('Response analysis failed:', error);
      return {
        sentimentScore: 0.5,
        engagementScore: 0.5,
        confidenceScore: 0.5,
        difficultyAppropriate: true,
        educationalValue: 0.5,
        crisisIndicators: [],
        responseLength: aiResponse.length,
        wordCount: aiResponse.split(' ').length
      };
    }
  }

  /**
   * Simple sentiment analysis (0-1 scale, 1 being most positive)
   */
  analyzeSentiment(text) {
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'good', 'nice', 'awesome', 'fantastic', 'love', 'happy', 'excited', 'confident', 'proud'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'angry', 'worried', 'anxious', 'scared', 'disappointed', 'frustrated'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0.5; // neutral baseline
    
    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) {
        score += 0.1;
      }
      if (negativeWords.some(neg => word.includes(neg))) {
        score -= 0.1;
      }
    });
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Analyze engagement level (0-1 scale)
   */
  analyzeEngagement(text) {
    const engagementIndicators = ['?', '!', 'you', 'your', 'how', 'what', 'tell me', 'share', 'think', 'feel'];
    const words = text.toLowerCase();
    
    let score = 0.3; // baseline
    
    engagementIndicators.forEach(indicator => {
      if (words.includes(indicator)) {
        score += 0.1;
      }
    });
    
    // Questions boost engagement
    const questionCount = (text.match(/\?/g) || []).length;
    score += questionCount * 0.15;
    
    return Math.min(1, score);
  }

  /**
   * Analyze confidence building potential
   */
  analyzeConfidenceBuilding(text, personalityType) {
    const confidenceWords = ['you can', 'believe', 'capable', 'strong', 'confident', 'proud', 'achievement', 'success', 'grow', 'improve'];
    const words = text.toLowerCase();
    
    let score = 0.4; // baseline
    
    confidenceWords.forEach(word => {
      if (words.includes(word)) {
        score += 0.1;
      }
    });
    
    // Adjust based on personality type
    if (personalityType === 'supportive' || personalityType === 'confident') {
      score += 0.2;
    }
    
    return Math.min(1, score);
  }

  /**
   * Check if response difficulty matches user level
   */
  analyzeDifficultyMatch(text, difficultyLevel) {
    const wordCount = text.split(' ').length;
    const avgWordLength = text.replace(/[^a-zA-Z]/g, '').length / wordCount;
    
    switch (difficultyLevel) {
      case 'beginner':
        return wordCount <= 50 && avgWordLength <= 5;
      case 'intermediate':
        return wordCount <= 100 && avgWordLength <= 6;
      case 'advanced':
        return wordCount <= 150;
      case 'expert':
        return true; // No restrictions for expert level
      default:
        return true;
    }
  }

  /**
   * Analyze educational value
   */
  analyzeEducationalValue(text) {
    const educationalWords = ['learn', 'practice', 'try', 'remember', 'technique', 'skill', 'tip', 'strategy', 'approach', 'method'];
    const words = text.toLowerCase();
    
    let score = 0.3; // baseline
    
    educationalWords.forEach(word => {
      if (words.includes(word)) {
        score += 0.1;
      }
    });
    
    return Math.min(1, score);
  }

  /**
   * Detect crisis indicators in user message
   */
  detectCrisisIndicators(userMessage) {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'not worth living', 'want to die',
      'self harm', 'hurt myself', 'cut myself', 'overdose',
      'hopeless', 'no point', 'give up', 'can\'t go on',
      'hate myself', 'worthless', 'burden', 'everyone better without me'
    ];
    
    const indicators = [];
    const lowerText = userMessage.toLowerCase();
    
    crisisKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        indicators.push(keyword);
      }
    });
    
    return indicators;
  }

  /**
   * Generate conversation insights and analysis
   */
  async generateConversationAnalysis(sessionId, messages, userProgress) {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(messages, userProgress);
      
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: analysisPrompt },
          { role: 'user', content: 'Please analyze this conversation and provide insights.' }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      const analysisText = completion.choices[0].message.content;
      
      // Parse the analysis into structured data
      const analysis = this.parseConversationAnalysis(analysisText);
      
      return analysis;
    } catch (error) {
      logger.error('Conversation analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build analysis prompt for conversation insights
   */
  buildAnalysisPrompt(messages, userProgress) {
    let prompt = `You are an expert social confidence coach analyzing a practice conversation. 

Conversation Messages:
${messages.map(msg => `${msg.message_type.toUpperCase()}: ${msg.content}`).join('\n')}

User Progress Context:
- Current Confidence Score: ${userProgress?.overall_confidence_score || 'Unknown'}
- Strengths: ${userProgress?.strengths?.join(', ') || 'None identified yet'}
- Areas to Improve: ${userProgress?.improvement_areas?.join(', ') || 'None identified yet'}

Please provide a comprehensive analysis in the following JSON format:
{
  "overallConfidenceGrowth": 0.0-10.0,
  "conversationQuality": {
    "clarity": 0.0-10.0,
    "engagement": 0.0-10.0,
    "authenticity": 0.0-10.0,
    "empathy": 0.0-10.0
  },
  "strengthsIdentified": ["strength1", "strength2"],
  "improvementAreas": ["area1", "area2"],
  "specificFeedback": "Detailed feedback paragraph",
  "actionableAdvice": ["tip1", "tip2", "tip3"],
  "confidenceBoostingSuggestions": ["suggestion1", "suggestion2"],
  "nextSteps": "Recommendations for next practice session"
}

Focus on constructive, actionable feedback that builds confidence.`;

    return prompt;
  }

  /**
   * Parse conversation analysis from AI response
   */
  parseConversationAnalysis(analysisText) {
    try {
      // Try to parse as JSON first
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: create structured analysis from text
      return {
        overallConfidenceGrowth: 5.0,
        conversationQuality: {
          clarity: 7.0,
          engagement: 6.0,
          authenticity: 7.0,
          empathy: 6.0
        },
        strengthsIdentified: ['Active listening', 'Asking questions'],
        improvementAreas: ['Body language awareness', 'Conversation flow'],
        specificFeedback: analysisText.substring(0, 200),
        actionableAdvice: ['Practice active listening', 'Work on question timing'],
        confidenceBoostingSuggestions: ['Celebrate small wins', 'Practice regularly'],
        nextSteps: 'Continue with similar scenarios to build consistency'
      };
    } catch (error) {
      logger.error('Failed to parse conversation analysis:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Get default analysis structure
   */
  getDefaultAnalysis() {
    return {
      overallConfidenceGrowth: 5.0,
      conversationQuality: {
        clarity: 6.0,
        engagement: 6.0,
        authenticity: 6.0,
        empathy: 6.0
      },
      strengthsIdentified: ['Willingness to practice'],
      improvementAreas: ['Continue practicing'],
      specificFeedback: 'Keep practicing to build your social confidence!',
      actionableAdvice: ['Practice regularly', 'Be patient with yourself'],
      confidenceBoostingSuggestions: ['Celebrate progress', 'Set small goals'],
      nextSteps: 'Try different scenarios to broaden your skills'
    };
  }

  /**
   * Health check for AI service
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return { healthy: false, error: 'Service not initialized' };
      }

      // Test OpenAI connection with a simple request
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });

      return {
        healthy: true,
        personalitiesLoaded: this.personalities.size,
        openaiConnected: !!completion
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
module.exports = new AIService();