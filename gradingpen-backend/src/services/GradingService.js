const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const natural = require('natural');
const winston = require('winston');
const FeedbackGenerator = require('./FeedbackGenerator');
const PlagiarismDetector = require('./PlagiarismDetector');
const RubricProcessor = require('./RubricProcessor');

class GradingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.feedbackGenerator = new FeedbackGenerator();
    this.plagiarismDetector = new PlagiarismDetector();
    this.rubricProcessor = new RubricProcessor();
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/grading.log' })
      ]
    });

    // Subject-specific model configurations
    this.subjectModels = {
      'english': {
        model: 'gpt-4',
        provider: 'openai',
        systemPrompt: this.getEnglishSystemPrompt(),
        focus: ['grammar', 'structure', 'argument', 'style', 'creativity']
      },
      'math': {
        model: 'claude-3-opus-20240229',
        provider: 'anthropic',
        systemPrompt: this.getMathSystemPrompt(),
        focus: ['accuracy', 'methodology', 'reasoning', 'presentation']
      },
      'science': {
        model: 'gpt-4',
        provider: 'openai',
        systemPrompt: this.getScienceSystemPrompt(),
        focus: ['methodology', 'analysis', 'conclusions', 'scientific_writing']
      },
      'history': {
        model: 'claude-3-opus-20240229',
        provider: 'anthropic',
        systemPrompt: this.getHistorySystemPrompt(),
        focus: ['evidence', 'argument', 'context', 'analysis', 'sources']
      }
    };
  }

  /**
   * Grade a single submission
   * @param {Object} submission - Student submission data
   * @param {Object} assignment - Assignment details
   * @param {Object} rubric - Grading rubric
   * @returns {Object} Grading result
   */
  async gradeSubmission(submission, assignment, rubric) {
    try {
      this.logger.info(`Starting grading for submission ${submission.id}`);
      
      const startTime = Date.now();
      
      // 1. Detect plagiarism first
      const plagiarismResult = await this.plagiarismDetector.checkPlagiarism(
        submission.content, 
        assignment.subject
      );
      
      // 2. Analyze content with subject-specific AI model
      const contentAnalysis = await this.analyzeContent(
        submission.content,
        assignment.subject,
        assignment.prompt,
        assignment.gradeLevel
      );
      
      // 3. Score against rubric
      const rubricScores = await this.rubricProcessor.scoreAgainstRubric(
        contentAnalysis,
        rubric
      );
      
      // 4. Generate feedback
      const feedback = await this.feedbackGenerator.generateFeedback(
        contentAnalysis,
        rubricScores,
        assignment.gradeLevel,
        plagiarismResult
      );
      
      // 5. Calculate final grade
      const finalGrade = this.calculateFinalGrade(rubricScores, rubric);
      
      const processingTime = Date.now() - startTime;
      
      const gradingResult = {
        submissionId: submission.id,
        grade: finalGrade,
        rubricScores: rubricScores,
        feedback: feedback,
        plagiarismReport: plagiarismResult,
        confidenceLevel: contentAnalysis.confidence,
        processingTime: processingTime,
        gradedAt: new Date().toISOString(),
        aiModel: this.subjectModels[assignment.subject].model,
        status: 'completed'
      };
      
      this.logger.info(`Grading completed for submission ${submission.id} in ${processingTime}ms`);
      
      return gradingResult;
      
    } catch (error) {
      this.logger.error(`Error grading submission ${submission.id}:`, error);
      throw new Error(`Grading failed: ${error.message}`);
    }
  }

  /**
   * Grade multiple submissions in batch
   * @param {Array} submissions - Array of submissions
   * @param {Object} assignment - Assignment details
   * @param {Object} rubric - Grading rubric
   * @returns {Array} Array of grading results
   */
  async gradeBatch(submissions, assignment, rubric) {
    try {
      this.logger.info(`Starting batch grading for ${submissions.length} submissions`);
      
      const batchSize = 5; // Process 5 at a time to avoid rate limits
      const results = [];
      
      for (let i = 0; i < submissions.length; i += batchSize) {
        const batch = submissions.slice(i, i + batchSize);
        
        const batchPromises = batch.map(submission => 
          this.gradeSubmission(submission, assignment, rubric)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            this.logger.error(`Failed to grade submission ${batch[index].id}:`, result.reason);
            results.push({
              submissionId: batch[index].id,
              error: result.reason.message,
              status: 'failed'
            });
          }
        });
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < submissions.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      this.logger.info(`Batch grading completed. ${results.length} results generated`);
      
      return results;
      
    } catch (error) {
      this.logger.error('Error in batch grading:', error);
      throw new Error(`Batch grading failed: ${error.message}`);
    }
  }

  /**
   * Analyze content using subject-specific AI model
   * @param {string} content - Submission content
   * @param {string} subject - Subject area
   * @param {string} prompt - Assignment prompt
   * @param {string} gradeLevel - Grade level
   * @returns {Object} Content analysis result
   */
  async analyzeContent(content, subject, prompt, gradeLevel) {
    const modelConfig = this.subjectModels[subject.toLowerCase()];
    
    if (!modelConfig) {
      throw new Error(`Unsupported subject: ${subject}`);
    }
    
    const analysisPrompt = this.buildAnalysisPrompt(content, prompt, gradeLevel, modelConfig);
    
    let analysis;
    
    if (modelConfig.provider === 'openai') {
      analysis = await this.callOpenAI(modelConfig.model, modelConfig.systemPrompt, analysisPrompt);
    } else if (modelConfig.provider === 'anthropic') {
      analysis = await this.callAnthropic(modelConfig.model, modelConfig.systemPrompt, analysisPrompt);
    } else {
      throw new Error(`Unsupported AI provider: ${modelConfig.provider}`);
    }
    
    return this.parseAnalysisResult(analysis, modelConfig.focus);
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(model, systemPrompt, userPrompt) {
    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      this.logger.error('OpenAI API error:', error);
      throw new Error(`OpenAI API call failed: ${error.message}`);
    }
  }

  /**
   * Call Anthropic API
   */
  async callAnthropic(model, systemPrompt, userPrompt) {
    try {
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });
      
      return response.content[0].text;
    } catch (error) {
      this.logger.error('Anthropic API error:', error);
      throw new Error(`Anthropic API call failed: ${error.message}`);
    }
  }

  /**
   * Build analysis prompt based on subject and content
   */
  buildAnalysisPrompt(content, assignmentPrompt, gradeLevel, modelConfig) {
    return `
Please analyze the following student submission:

Assignment Prompt: "${assignmentPrompt}"
Grade Level: ${gradeLevel}
Focus Areas: ${modelConfig.focus.join(', ')}

Student Submission:
"""
${content}
"""

Provide a detailed analysis in JSON format with the following structure:
{
  "overall_quality": "score_1_to_10",
  "strengths": ["list", "of", "strengths"],
  "weaknesses": ["list", "of", "areas", "for", "improvement"],
  "specific_feedback": {
    ${modelConfig.focus.map(focus => `"${focus}": {"score": "1-10", "comments": "specific feedback"}`).join(',\n    ')}
  },
  "confidence": "0.0_to_1.0",
  "word_count": "actual_word_count",
  "reading_level": "estimated_reading_level",
  "key_concepts": ["identified", "concepts"]
}
`;
  }

  /**
   * Parse AI analysis result
   */
  parseAnalysisResult(analysisText, focusAreas) {
    try {
      const parsed = JSON.parse(analysisText);
      
      // Validate the structure
      if (!parsed.overall_quality || !parsed.specific_feedback) {
        throw new Error('Invalid analysis structure');
      }
      
      // Ensure all focus areas are covered
      focusAreas.forEach(area => {
        if (!parsed.specific_feedback[area]) {
          parsed.specific_feedback[area] = {
            score: 5,
            comments: 'Analysis not available for this area'
          };
        }
      });
      
      return parsed;
    } catch (error) {
      this.logger.error('Error parsing AI analysis:', error);
      
      // Return default structure if parsing fails
      return {
        overall_quality: 5,
        strengths: ['Submission received'],
        weaknesses: ['Could not complete analysis'],
        specific_feedback: focusAreas.reduce((acc, area) => {
          acc[area] = { score: 5, comments: 'Analysis unavailable' };
          return acc;
        }, {}),
        confidence: 0.5,
        word_count: content.split(/\s+/).length,
        reading_level: 'Unknown',
        key_concepts: []
      };
    }
  }

  /**
   * Calculate final grade based on rubric scores
   */
  calculateFinalGrade(rubricScores, rubric) {
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.keys(rubricScores).forEach(criterion => {
      const score = rubricScores[criterion];
      const weight = rubric.criteria[criterion]?.weight || 1;
      
      totalScore += score * weight;
      totalWeight += weight;
    });
    
    const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Convert to grade scale based on rubric configuration
    if (rubric.scale === 'letter') {
      return this.convertToLetterGrade(averageScore);
    } else if (rubric.scale === 'percentage') {
      return Math.round(averageScore * 10); // Convert 1-10 to percentage
    } else {
      return Math.round(averageScore * 10) / 10; // Points scale
    }
  }

  /**
   * Convert numeric score to letter grade
   */
  convertToLetterGrade(score) {
    if (score >= 9) return 'A';
    if (score >= 8) return 'B';
    if (score >= 7) return 'C';
    if (score >= 6) return 'D';
    return 'F';
  }

  // System prompts for different subjects
  getEnglishSystemPrompt() {
    return `You are an expert English teacher with 20+ years of experience grading student essays and creative writing. 
    Analyze writing for grammar, structure, argument development, style, and creativity. 
    Provide constructive feedback that helps students improve their writing skills.
    Focus on both technical accuracy and creative expression.`;
  }

  getMathSystemPrompt() {
    return `You are an expert mathematics teacher with deep knowledge of problem-solving techniques and mathematical reasoning.
    Analyze solutions for accuracy, methodology, step-by-step reasoning, and clarity of presentation.
    Look for conceptual understanding, not just correct answers.
    Provide feedback that helps students understand mathematical concepts better.`;
  }

  getScienceSystemPrompt() {
    return `You are an expert science teacher with experience in scientific methodology and research.
    Analyze submissions for scientific accuracy, methodology, data analysis, and conclusions.
    Focus on the scientific process, critical thinking, and evidence-based reasoning.
    Provide feedback that encourages scientific inquiry and proper methodology.`;
  }

  getHistorySystemPrompt() {
    return `You are an expert history teacher with deep knowledge of historical analysis and research methods.
    Analyze submissions for use of evidence, argument structure, historical context, and source analysis.
    Focus on critical thinking, historical understanding, and proper use of sources.
    Provide feedback that helps students develop historical thinking skills.`;
  }
}

module.exports = GradingService;