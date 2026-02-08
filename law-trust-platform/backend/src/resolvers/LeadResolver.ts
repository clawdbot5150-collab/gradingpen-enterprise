import { 
  Resolver, 
  Query, 
  Mutation, 
  Arg, 
  Args, 
  Ctx, 
  ID, 
  Int, 
  Float,
  Authorized,
  FieldResolver,
  Root,
  Subscription,
} from 'type-graphql';
import { getRepository, Repository, Like, Between, In } from 'typeorm';
import { Lead, LeadStatus, PracticeArea, UrgencyLevel, LeadSource } from '../entities/Lead';
import { Lawyer } from '../entities/Lawyer';
import { LeadInteraction } from '../entities/LeadInteraction';
import { OpenAIService } from '../services/OpenAIService';
import { TwilioService } from '../services/TwilioService';
import { SendGridService } from '../services/SendGridService';
import { LeadMatchingService } from '../services/LeadMatchingService';
import { LeadQualificationService } from '../services/LeadQualificationService';
import { Context } from '../types/Context';
import { PaginatedLeads, LeadFilters, CreateLeadInput, UpdateLeadInput, LeadStats } from '../types/Lead';

@Resolver(Lead)
export class LeadResolver {
  private leadRepository: Repository<Lead>;
  private lawyerRepository: Repository<Lawyer>;
  private interactionRepository: Repository<LeadInteraction>;
  private openAIService: OpenAIService;
  private twilioService: TwilioService;
  private sendGridService: SendGridService;
  private leadMatchingService: LeadMatchingService;
  private leadQualificationService: LeadQualificationService;

  constructor() {
    this.leadRepository = getRepository(Lead);
    this.lawyerRepository = getRepository(Lawyer);
    this.interactionRepository = getRepository(LeadInteraction);
    this.openAIService = new OpenAIService();
    this.twilioService = new TwilioService();
    this.sendGridService = new SendGridService();
    this.leadMatchingService = new LeadMatchingService();
    this.leadQualificationService = new LeadQualificationService();
  }

  @Query(() => PaginatedLeads)
  @Authorized()
  async leads(
    @Args() filters: LeadFilters,
    @Arg('page', () => Int, { defaultValue: 1 }) page: number,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number,
    @Ctx() ctx: Context
  ): Promise<PaginatedLeads> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.leadRepository.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.matchedLawyer', 'lawyer')
      .leftJoinAndSelect('lead.interactions', 'interactions')
      .leftJoinAndSelect('lead.case', 'case');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('lead.status IN (:...status)', { status: filters.status });
    }
    
    if (filters.practiceAreas) {
      queryBuilder.andWhere('lead.practiceArea IN (:...practiceAreas)', { 
        practiceAreas: filters.practiceAreas 
      });
    }

    if (filters.urgencyLevel) {
      queryBuilder.andWhere('lead.urgencyLevel IN (:...urgencyLevel)', { 
        urgencyLevel: filters.urgencyLevel 
      });
    }

    if (filters.source) {
      queryBuilder.andWhere('lead.source IN (:...source)', { source: filters.source });
    }

    if (filters.minValue !== undefined) {
      queryBuilder.andWhere('lead.estimatedCaseValue >= :minValue', { minValue: filters.minValue });
    }

    if (filters.maxValue !== undefined) {
      queryBuilder.andWhere('lead.estimatedCaseValue <= :maxValue', { maxValue: filters.maxValue });
    }

    if (filters.state) {
      queryBuilder.andWhere('lead.state IN (:...state)', { state: filters.state });
    }

    if (filters.city) {
      queryBuilder.andWhere('lead.city IN (:...city)', { city: filters.city });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('lead.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('lead.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.lawyerId) {
      queryBuilder.andWhere('lead.matchedLawyerId = :lawyerId', { lawyerId: filters.lawyerId });
    }

    if (filters.isEmergency !== undefined) {
      queryBuilder.andWhere('lead.urgencyLevel = :urgency', { 
        urgency: filters.isEmergency ? UrgencyLevel.EMERGENCY : UrgencyLevel.LOW 
      });
    }

    // Search functionality
    if (filters.search) {
      queryBuilder.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search OR lead.caseDescription ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`lead.${sortField}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const leads = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  @Query(() => Lead)
  @Authorized()
  async lead(@Arg('id', () => ID) id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id },
      relations: ['matchedLawyer', 'interactions', 'case'],
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    return lead;
  }

  @Query(() => LeadStats)
  @Authorized()
  async leadStats(
    @Arg('dateFrom', { nullable: true }) dateFrom?: Date,
    @Arg('dateTo', { nullable: true }) dateTo?: Date,
    @Arg('lawyerId', () => ID, { nullable: true }) lawyerId?: string
  ): Promise<LeadStats> {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead');

    if (dateFrom) {
      queryBuilder.andWhere('lead.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('lead.createdAt <= :dateTo', { dateTo });
    }

    if (lawyerId) {
      queryBuilder.andWhere('lead.matchedLawyerId = :lawyerId', { lawyerId });
    }

    const [
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      emergencyLeads,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.QUALIFIED }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.CONVERTED }).getCount(),
      queryBuilder.clone().andWhere('lead.urgencyLevel = :urgency', { urgency: UrgencyLevel.EMERGENCY }).getCount(),
    ]);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Get average case value
    const avgValueResult = await queryBuilder
      .select('AVG(lead.estimatedCaseValue)', 'avgValue')
      .getRawOne();

    const averageCaseValue = parseFloat(avgValueResult?.avgValue || '0');

    // Get total value
    const totalValueResult = await queryBuilder
      .select('SUM(lead.estimatedCaseValue)', 'totalValue')
      .getRawOne();

    const totalCaseValue = parseFloat(totalValueResult?.totalValue || '0');

    return {
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      emergencyLeads,
      conversionRate,
      averageCaseValue,
      totalCaseValue,
    };
  }

  @Mutation(() => Lead)
  async createLead(@Arg('input') input: CreateLeadInput): Promise<Lead> {
    // Create the lead
    const lead = this.leadRepository.create({
      ...input,
      status: LeadStatus.NEW,
    });

    // AI-powered qualification
    await this.qualifyLead(lead);

    const savedLead = await this.leadRepository.save(lead);

    // Find matching lawyers
    if (savedLead.qualificationScore >= 70) {
      await this.findAndMatchLawyers(savedLead);
    }

    // Send notifications for emergency leads
    if (savedLead.urgencyLevel === UrgencyLevel.EMERGENCY) {
      await this.handleEmergencyLead(savedLead);
    }

    return savedLead;
  }

  @Mutation(() => Lead)
  @Authorized()
  async updateLead(
    @Arg('id', () => ID) id: string,
    @Arg('input') input: UpdateLeadInput
  ): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id } });
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    Object.assign(lead, input);
    
    // Re-qualify if important fields changed
    if (input.caseDescription || input.practiceArea || input.incidentDate) {
      await this.qualifyLead(lead);
    }

    return await this.leadRepository.save(lead);
  }

  @Mutation(() => Lead)
  @Authorized()
  async matchLeadToLawyer(
    @Arg('leadId', () => ID) leadId: string,
    @Arg('lawyerId', () => ID) lawyerId: string,
    @Ctx() ctx: Context
  ): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    const lawyer = await this.lawyerRepository.findOne({ where: { id: lawyerId } });

    if (!lead) throw new Error('Lead not found');
    if (!lawyer) throw new Error('Lawyer not found');

    lead.matchedLawyer = lawyer;
    lead.matchedLawyerId = lawyerId;
    lead.status = LeadStatus.MATCHED;
    lead.matchedAt = new Date();

    // Create interaction record
    await this.interactionRepository.save({
      lead,
      lawyer,
      type: 'LAWYER_ASSIGNED',
      description: `Lead matched to ${lawyer.fullName}`,
      isSystemGenerated: true,
    });

    // Notify lawyer
    await this.notifyLawyerOfNewLead(lawyer, lead);

    return await this.leadRepository.save(lead);
  }

  @Mutation(() => Boolean)
  @Authorized()
  async bulkUpdateLeads(
    @Arg('ids', () => [ID]) ids: string[],
    @Arg('updates') updates: Partial<UpdateLeadInput>
  ): Promise<boolean> {
    await this.leadRepository.update(
      { id: In(ids) },
      updates
    );
    return true;
  }

  // Field Resolvers
  @FieldResolver(() => [LeadInteraction])
  async interactions(@Root() lead: Lead): Promise<LeadInteraction[]> {
    return await this.interactionRepository.find({
      where: { leadId: lead.id },
      order: { createdAt: 'DESC' },
      relations: ['lawyer'],
    });
  }

  @FieldResolver(() => Int)
  async responseTime(@Root() lead: Lead): Promise<number> {
    const firstResponse = await this.interactionRepository.findOne({
      where: { leadId: lead.id },
      order: { createdAt: 'ASC' },
    });

    if (!firstResponse) return 0;

    const diffMs = firstResponse.createdAt.getTime() - lead.createdAt.getTime();
    return Math.floor(diffMs / (1000 * 60)); // minutes
  }

  // Private helper methods
  private async qualifyLead(lead: Lead): Promise<void> {
    const qualification = await this.leadQualificationService.qualifyLead(lead);
    
    lead.qualificationScore = qualification.score;
    lead.estimatedCaseValue = qualification.estimatedValue;
    lead.conversionProbability = qualification.conversionProbability;
    lead.leadScore = qualification.leadScore;
    lead.urgencyLevel = qualification.urgencyLevel;
    
    if (qualification.urgencyLevel === UrgencyLevel.EMERGENCY) {
      lead.statuteOfLimitationsDate = qualification.statuteOfLimitationsDate;
    }
  }

  private async findAndMatchLawyers(lead: Lead): Promise<void> {
    const matchingLawyers = await this.leadMatchingService.findMatchingLawyers(lead);
    
    if (matchingLawyers.length > 0) {
      const bestMatch = matchingLawyers[0];
      lead.matchedLawyer = bestMatch.lawyer;
      lead.matchedLawyerId = bestMatch.lawyer.id;
      lead.status = LeadStatus.MATCHED;
      lead.matchedAt = new Date();

      // Notify the matched lawyer
      await this.notifyLawyerOfNewLead(bestMatch.lawyer, lead);
    }
  }

  private async handleEmergencyLead(lead: Lead): Promise<void> {
    // Find lawyers who accept emergency leads
    const emergencyLawyers = await this.lawyerRepository.find({
      where: {
        acceptEmergencyLeads: true,
        available24x7: true,
        practiceAreas: Like(`%${lead.practiceArea}%`),
        status: 'ACTIVE',
      },
    });

    // Send immediate notifications to all emergency lawyers
    const notifications = emergencyLawyers.map(lawyer => 
      this.notifyEmergencyLead(lawyer, lead)
    );

    await Promise.all(notifications);
  }

  private async notifyLawyerOfNewLead(lawyer: Lawyer, lead: Lead): Promise<void> {
    const notifications = [];

    // Email notification
    if (lawyer.emailNotifications) {
      notifications.push(
        this.sendGridService.sendNewLeadNotification(lawyer, lead)
      );
    }

    // SMS notification
    if (lawyer.smsNotifications) {
      notifications.push(
        this.twilioService.sendNewLeadSMS(lawyer, lead)
      );
    }

    await Promise.all(notifications);
  }

  private async notifyEmergencyLead(lawyer: Lawyer, lead: Lead): Promise<void> {
    const notifications = [];

    // Always send SMS for emergency leads
    notifications.push(
      this.twilioService.sendEmergencyLeadSMS(lawyer, lead)
    );

    // Also send email
    notifications.push(
      this.sendGridService.sendEmergencyLeadNotification(lawyer, lead)
    );

    // Make phone call if available 24/7
    if (lawyer.available24x7) {
      notifications.push(
        this.twilioService.makeEmergencyLeadCall(lawyer, lead)
      );
    }

    await Promise.all(notifications);
  }
}