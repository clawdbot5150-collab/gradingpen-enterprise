import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float, registerEnumType } from 'type-graphql';
import { IsEmail, IsPhoneNumber, IsUrl, MinLength } from 'class-validator';
import { Lead, PracticeArea } from './Lead';
import { Case } from './Case';
import { LawyerReview } from './LawyerReview';
import { Subscription } from './Subscription';

export enum LawyerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum SubscriptionTier {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum BarStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISBARRED = 'DISBARRED',
}

registerEnumType(LawyerStatus, { name: 'LawyerStatus' });
registerEnumType(SubscriptionTier, { name: 'SubscriptionTier' });
registerEnumType(BarStatus, { name: 'BarStatus' });

@ObjectType()
@Entity('lawyers')
@Index(['status', 'subscriptionTier'])
@Index(['city', 'state'])
@Index(['barNumber'])
export class Lawyer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Personal Information
  @Field()
  @Column()
  @MinLength(2)
  firstName!: string;

  @Field()
  @Column()
  @MinLength(2)
  lastName!: string;

  @Field()
  @Column({ unique: true })
  @IsEmail()
  email!: string;

  @Field()
  @Column()
  @IsPhoneNumber('US')
  phone!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsPhoneNumber('US')
  mobilePhone?: string;

  // Location
  @Field()
  @Column()
  city!: string;

  @Field()
  @Column({ length: 2 })
  state!: string;

  @Field()
  @Column({ length: 10 })
  zipCode!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  address?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // Professional Information
  @Field()
  @Column({ unique: true })
  barNumber!: string;

  @Field(() => [String])
  @Column({ type: 'json' })
  barStates!: string[];

  @Field(() => BarStatus)
  @Column({
    type: 'enum',
    enum: BarStatus,
    default: BarStatus.ACTIVE,
  })
  barStatus!: BarStatus;

  @Field()
  @Column()
  lawSchool!: string;

  @Field()
  @Column()
  graduationYear!: number;

  @Field()
  @Column()
  yearsExperience!: number;

  @Field()
  @Column()
  firmName!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  firmDescription?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsUrl()
  firmWebsite?: string;

  // Practice Areas and Specializations
  @Field(() => [PracticeArea])
  @Column({ type: 'json' })
  practiceAreas!: PracticeArea[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  specializations?: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  certifications?: string[];

  // Service Areas (geographic coverage)
  @Field(() => [String])
  @Column({ type: 'json' })
  serviceStates!: string[];

  @Field(() => [String])
  @Column({ type: 'json' })
  serviceCities!: string[];

  @Field(() => [String])
  @Column({ type: 'json' })
  serviceCounties!: string[];

  @Field(() => Int)
  @Column({ default: 50 })
  serviceRadiusMiles!: number;

  // Lead Preferences and Capacity
  @Field(() => Int)
  @Column({ default: 10 })
  maxLeadsPerMonth!: number;

  @Field(() => Int)
  @Column({ default: 5 })
  maxLeadsPerDay!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minCaseValue!: number;

  @Field(() => [PracticeArea], { nullable: true })
  @Column({ type: 'json', nullable: true })
  excludedPracticeAreas?: PracticeArea[];

  @Field()
  @Column({ default: true })
  acceptEmergencyLeads!: boolean;

  @Field()
  @Column({ default: true })
  available24x7!: boolean;

  // Pricing and Budget
  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyLeadBudget!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentMonthSpend!: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  hourlyRate?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  contingencyFeePercentage?: number;

  // Performance Metrics
  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  conversionRate!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  responseTimeAvgMinutes!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  clientSatisfactionRating!: number;

  @Field(() => Int)
  @Column({ default: 0 })
  totalCasesWon!: number;

  @Field(() => Int)
  @Column({ default: 0 })
  totalCasesLost!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSettlementAmount!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  averageSettlementAmount!: number;

  // Subscription and Status
  @Field(() => LawyerStatus)
  @Column({
    type: 'enum',
    enum: LawyerStatus,
    default: LawyerStatus.PENDING_VERIFICATION,
  })
  status!: LawyerStatus;

  @Field(() => SubscriptionTier)
  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.BASIC,
  })
  subscriptionTier!: SubscriptionTier;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  subscriptionExpiresAt?: Date;

  @Field()
  @Column({ default: true })
  isVerified!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  // Communication Preferences
  @Field()
  @Column({ default: true })
  emailNotifications!: boolean;

  @Field()
  @Column({ default: true })
  smsNotifications!: boolean;

  @Field()
  @Column({ default: false })
  pushNotifications!: boolean;

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  preferredContactMethods?: string[];

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  timezone?: string;

  // Profile and Marketing
  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  profileImageUrl?: string;

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  profileImages?: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  awards?: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  publications?: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  languages?: string[];

  // Authentication
  @Column()
  passwordHash!: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ nullable: true })
  resetPasswordExpiresAt?: Date;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Field()
  @Column({ default: false })
  emailVerified!: boolean;

  // CLE Credits Tracking
  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cleCreditsEarned!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cleCreditsRequired!: number;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  cleReportingPeriodEnd?: Date;

  // Relationships
  @Field(() => [Lead])
  @OneToMany(() => Lead, lead => lead.matchedLawyer)
  leads!: Lead[];

  @Field(() => [Case])
  @OneToMany(() => Case, case => case.lawyer)
  cases!: Case[];

  @Field(() => [LawyerReview])
  @OneToMany(() => LawyerReview, review => review.lawyer)
  reviews!: LawyerReview[];

  @Field(() => [Subscription])
  @OneToMany(() => Subscription, subscription => subscription.lawyer)
  subscriptions!: Subscription[];

  // Metadata
  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  // Timestamps
  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;

  // Computed fields for GraphQL
  @Field()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Field()
  get displayName(): string {
    return `${this.fullName}, Esq.`;
  }

  @Field(() => Float)
  get winRate(): number {
    const totalCases = this.totalCasesWon + this.totalCasesLost;
    return totalCases > 0 ? (this.totalCasesWon / totalCases) * 100 : 0;
  }

  @Field()
  get isActiveSubscription(): boolean {
    return this.subscriptionExpiresAt ? new Date() < this.subscriptionExpiresAt : false;
  }

  @Field()
  get canReceiveLeads(): boolean {
    return (
      this.status === LawyerStatus.ACTIVE &&
      this.isActiveSubscription &&
      this.isVerified &&
      this.barStatus === BarStatus.ACTIVE
    );
  }

  @Field(() => Int)
  get totalReviews(): number {
    return this.reviews?.length || 0;
  }

  @Field(() => Float)
  get averageRating(): number {
    if (!this.reviews?.length) return 0;
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / this.reviews.length;
  }
}