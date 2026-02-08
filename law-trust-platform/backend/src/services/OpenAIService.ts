import OpenAI from 'openai';
import { Lead, PracticeArea, UrgencyLevel } from '../entities/Lead';

interface LeadAnalysis {
  qualificationScore: number;
  estimatedCaseValue: number;
  conversionProbability: number;
  urgencyLevel: UrgencyLevel;
  riskFactors: string[];
  strengthsOfCase: string[];
  recommendedActions: string[];
  keyInsights: string;
}

interface CaseValueAnalysis {
  estimatedValue: number;
  confidence: number;
  valueDrivers: string[];
  riskFactors: string[];
  comparableCases: Array<{
    description: string;
    settlementAmount: number;
    jurisdiction: string;
  }>;
}

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Comprehensive AI-powered lead analysis
   */
  async analyzeLead(lead: Lead): Promise<LeadAnalysis> {
    const prompt = this.buildLeadAnalysisPrompt(lead);
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return this.parseLeadAnalysis(response);
    } catch (error) {
      console.error('OpenAI lead analysis failed:', error);
      return this.getFallbackAnalysis(lead);
    }
  }

  /**
   * Estimate case value using AI
   */
  async estimateCaseValue(lead: Lead): Promise<CaseValueAnalysis> {
    const prompt = this.buildCaseValuePrompt(lead);
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: this.getCaseValueSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return this.parseCaseValueAnalysis(response);
    } catch (error) {
      console.error('OpenAI case value estimation failed:', error);
      return this.getFallbackCaseValue(lead);
    }
  }

  /**
   * Generate intelligent follow-up questions for lead intake
   */
  async generateFollowUpQuestions(lead: Lead, previousAnswers: Record<string, any>): Promise<string[]> {
    const prompt = this.buildFollowUpQuestionsPrompt(lead, previousAnswers);
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal intake specialist. Generate intelligent, relevant follow-up questions to better understand the case and qualify the lead. Return a JSON array of questions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return response.questions || [];
    } catch (error) {
      console.error('OpenAI follow-up questions failed:', error);
      return this.getFallbackFollowUpQuestions(lead);
    }
  }

  /**
   * Analyze document content for legal cases
   */
  async analyzeDocument(documentText: string, practiceArea: PracticeArea): Promise<{
    summary: string;
    keyPoints: string[];
    relevantDates: Date[];
    parties: string[];
    riskFactors: string[];
    actionItems: string[];
  }> {
    const prompt = `Analyze this legal document for a ${practiceArea} case:

${documentText}

Please provide:
1. A brief summary
2. Key points and facts
3. Important dates mentioned
4. Parties involved
5. Risk factors or red flags
6. Recommended action items

Return as JSON with the specified structure.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal document analyst. Extract key information and provide actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI document analysis failed:', error);
      return {
        summary: 'Document analysis unavailable',
        keyPoints: [],
        relevantDates: [],
        parties: [],
        riskFactors: [],
        actionItems: [],
      };
    }
  }

  /**
   * Generate personalized email templates for lawyer-client communication
   */
  async generateEmailTemplate(
    templateType: 'initial_contact' | 'follow_up' | 'consultation_invite' | 'case_update',
    lawyer: any,
    lead: Lead,
    context?: Record<string, any>
  ): Promise<{
    subject: string;
    body: string;
    callToAction: string;
  }> {
    const prompt = this.buildEmailTemplatePrompt(templateType, lawyer, lead, context);
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal marketing copywriter. Generate professional, persuasive, and empathetic email templates for lawyers to communicate with potential clients.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI email template generation failed:', error);
      return {
        subject: 'Regarding Your Legal Matter',
        body: 'Thank you for your inquiry. I would like to discuss your case.',
        callToAction: 'Please call my office to schedule a consultation.',
      };
    }
  }

  // Private helper methods

  private getSystemPrompt(): string {
    return `You are an expert legal case analyst with 20+ years of experience in evaluating legal leads across all practice areas. Your role is to:

1. Analyze the provided case information
2. Assess the likelihood of case success and settlement potential
3. Identify key risk factors and case strengths  
4. Determine urgency level based on statute of limitations and case type
5. Provide qualification scores and conversion probability
6. Recommend next steps for lead management

Consider factors like:
- Case merit and liability
- Damages and economic losses
- Jurisdiction and venue
- Client characteristics and credibility
- Statute of limitations deadlines
- Discovery requirements
- Settlement probability
- Attorney resource requirements

Return analysis in JSON format with numerical scores (0-100) and detailed insights.`;
  }

  private getCaseValueSystemPrompt(): string {
    return `You are an expert legal damages analyst specializing in case valuation across all practice areas. Consider:

Personal Injury:
- Medical expenses (past and future)
- Lost wages and earning capacity
- Pain and suffering multipliers (1.5-5x medical bills)
- Permanent disability ratings
- Jurisdiction settlement patterns

Estate Planning:
- Estate size and complexity
- Tax implications and savings
- Ongoing management fees
- Probate cost avoidance

Business Law:
- Economic damages and losses
- Contract values and disputes
- Intellectual property valuations
- Regulatory compliance costs

Provide realistic valuation ranges with confidence intervals and comparable case data.`;
  }

  private buildLeadAnalysisPrompt(lead: Lead): string {
    return `Analyze this legal lead:

CASE DETAILS:
- Practice Area: ${lead.practiceArea}
- Case Description: ${lead.caseDescription}
- Incident Date: ${lead.incidentDate || 'Not specified'}
- Location: ${lead.city}, ${lead.state}
- Client: ${lead.firstName} ${lead.lastName}

ADDITIONAL INFO:
- Has Medical Treatment: ${lead.hasMedicalTreatment ? 'Yes' : 'No'}
- Medical Bills: $${lead.medicalBills || 0}
- Injuries: ${lead.injuries || 'Not specified'}
- Insurance: ${lead.hasInsurance ? 'Yes' : 'No'}
- Annual Income: $${lead.annualIncome || 'Not provided'}

Provide comprehensive analysis with qualification score (0-100), estimated case value, conversion probability (0-1), urgency level, and detailed insights.`;
  }

  private buildCaseValuePrompt(lead: Lead): string {
    return `Estimate the potential settlement/judgment value for this case:

${this.buildLeadAnalysisPrompt(lead)}

Consider jurisdiction-specific factors:
- Average settlements in ${lead.state} for ${lead.practiceArea}
- Local jury verdict patterns
- Insurance coverage limits
- Economic factors in ${lead.city}

Provide detailed valuation analysis with confidence intervals and supporting data.`;
  }

  private buildFollowUpQuestionsPrompt(lead: Lead, previousAnswers: Record<string, any>): string {
    return `Generate intelligent follow-up questions for this ${lead.practiceArea} case:

INITIAL INFO: ${lead.caseDescription}
PREVIOUS ANSWERS: ${JSON.stringify(previousAnswers)}

Generate 3-5 targeted questions to:
1. Better assess case merit
2. Understand damages/losses
3. Identify liability issues
4. Gauge client commitment
5. Uncover additional facts

Questions should be clear, relevant, and help qualify the lead effectively.`;
  }

  private buildEmailTemplatePrompt(
    templateType: string,
    lawyer: any,
    lead: Lead,
    context?: Record<string, any>
  ): string {
    return `Generate a ${templateType} email template:

LAWYER INFO:
- Name: ${lawyer.fullName}
- Firm: ${lawyer.firmName}
- Location: ${lawyer.city}, ${lawyer.state}
- Specialization: ${lawyer.practiceAreas?.join(', ')}

LEAD INFO:
- Name: ${lead.firstName} ${lead.lastName}
- Case Type: ${lead.practiceArea}
- Case Description: ${lead.caseDescription}
- Location: ${lead.city}, ${lead.state}

CONTEXT: ${context ? JSON.stringify(context) : 'Initial contact'}

Create a professional, empathetic email that:
1. Builds trust and credibility
2. Addresses the client's specific situation
3. Demonstrates expertise in their case type
4. Includes a clear call to action
5. Maintains professional legal standards

Return as JSON with subject, body, and callToAction fields.`;
  }

  private parseLeadAnalysis(response: any): LeadAnalysis {
    return {
      qualificationScore: Math.max(0, Math.min(100, response.qualificationScore || 50)),
      estimatedCaseValue: Math.max(0, response.estimatedCaseValue || 0),
      conversionProbability: Math.max(0, Math.min(1, response.conversionProbability || 0.5)),
      urgencyLevel: this.parseUrgencyLevel(response.urgencyLevel),
      riskFactors: response.riskFactors || [],
      strengthsOfCase: response.strengthsOfCase || [],
      recommendedActions: response.recommendedActions || [],
      keyInsights: response.keyInsights || 'Analysis completed',
    };
  }

  private parseCaseValueAnalysis(response: any): CaseValueAnalysis {
    return {
      estimatedValue: Math.max(0, response.estimatedValue || 0),
      confidence: Math.max(0, Math.min(100, response.confidence || 50)),
      valueDrivers: response.valueDrivers || [],
      riskFactors: response.riskFactors || [],
      comparableCases: response.comparableCases || [],
    };
  }

  private parseUrgencyLevel(level: string): UrgencyLevel {
    switch (level?.toUpperCase()) {
      case 'EMERGENCY': return UrgencyLevel.EMERGENCY;
      case 'HIGH': return UrgencyLevel.HIGH;
      case 'MEDIUM': return UrgencyLevel.MEDIUM;
      case 'LOW': return UrgencyLevel.LOW;
      default: return UrgencyLevel.MEDIUM;
    }
  }

  private getFallbackAnalysis(lead: Lead): LeadAnalysis {
    // Simple fallback scoring based on practice area and basic info
    let score = 50;
    let estimatedValue = 10000;

    // Adjust based on practice area
    switch (lead.practiceArea) {
      case PracticeArea.WRONGFUL_DEATH:
        score += 20;
        estimatedValue = 500000;
        break;
      case PracticeArea.MEDICAL_MALPRACTICE:
        score += 15;
        estimatedValue = 300000;
        break;
      case PracticeArea.CAR_ACCIDENT:
        score += 10;
        estimatedValue = 50000;
        break;
    }

    // Adjust for medical treatment
    if (lead.hasMedicalTreatment) {
      score += 15;
      estimatedValue += (lead.medicalBills || 0) * 3;
    }

    return {
      qualificationScore: Math.min(100, score),
      estimatedCaseValue: estimatedValue,
      conversionProbability: 0.6,
      urgencyLevel: UrgencyLevel.MEDIUM,
      riskFactors: ['AI analysis unavailable'],
      strengthsOfCase: ['Case requires manual review'],
      recommendedActions: ['Schedule manual case review'],
      keyInsights: 'Fallback analysis - manual review recommended',
    };
  }

  private getFallbackCaseValue(lead: Lead): CaseValueAnalysis {
    const baseValue = this.getFallbackAnalysis(lead).estimatedCaseValue;
    
    return {
      estimatedValue: baseValue,
      confidence: 30,
      valueDrivers: ['Fallback estimation'],
      riskFactors: ['AI analysis unavailable'],
      comparableCases: [],
    };
  }

  private getFallbackFollowUpQuestions(lead: Lead): string[] {
    const baseQuestions = [
      'Can you provide more details about how the incident occurred?',
      'Have you sought medical treatment for any injuries?',
      'Do you have any documentation related to this matter?',
      'What outcome are you hoping to achieve?',
    ];

    // Customize based on practice area
    switch (lead.practiceArea) {
      case PracticeArea.CAR_ACCIDENT:
        return [
          'Were there any witnesses to the accident?',
          'Did you file a police report?',
          'Have you contacted your insurance company?',
          'Are you still experiencing pain or symptoms?',
        ];
      case PracticeArea.ESTATE_PLANNING:
        return [
          'Do you currently have a will or trust?',
          'What assets do you need to protect?',
          'Do you have minor children?',
          'Are there any family complications we should know about?',
        ];
      default:
        return baseQuestions;
    }
  }
}