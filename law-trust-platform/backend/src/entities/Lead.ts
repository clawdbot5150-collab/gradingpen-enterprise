import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float, registerEnumType } from 'type-graphql';
import { IsEmail, IsPhoneNumber, IsOptional, MinLength } from 'class-validator';
import { Lawyer } from './Lawyer';
import { Case } from './Case';
import { LeadInteraction } from './LeadInteraction';

export enum LeadStatus {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  CONTACTED = 'CONTACTED',
  MATCHED = 'MATCHED',
  CONVERTED = 'CONVERTED',
  REJECTED = 'REJECTED',
  LOST = 'LOST',
}

export enum PracticeArea {
  PERSONAL_INJURY = 'PERSONAL_INJURY',
  CAR_ACCIDENT = 'CAR_ACCIDENT',
  MEDICAL_MALPRACTICE = 'MEDICAL_MALPRACTICE',
  PRODUCT_LIABILITY = 'PRODUCT_LIABILITY',
  WRONGFUL_DEATH = 'WRONGFUL_DEATH',
  SLIP_AND_FALL = 'SLIP_AND_FALL',
  WORKERS_COMPENSATION = 'WORKERS_COMPENSATION',
  ESTATE_PLANNING = 'ESTATE_PLANNING',
  WILL_TRUST = 'WILL_TRUST',
  ESTATE_ADMINISTRATION = 'ESTATE_ADMINISTRATION',
  ASSET_PROTECTION = 'ASSET_PROTECTION',
  ELDER_LAW = 'ELDER_LAW',
  TAX_PLANNING = 'TAX_PLANNING',
  CRIMINAL_DEFENSE = 'CRIMINAL_DEFENSE',
  DUI = 'DUI',
  FAMILY_LAW = 'FAMILY_LAW',
  DIVORCE = 'DIVORCE',
  BUSINESS_LAW = 'BUSINESS_LAW',
  EMPLOYMENT_LAW = 'EMPLOYMENT_LAW',
  REAL_ESTATE_LAW = 'REAL_ESTATE_LAW',
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  PHONE = 'PHONE',
  CHAT = 'CHAT',
  SMS = 'SMS',
  GOOGLE_ADS = 'GOOGLE_ADS',
  FACEBOOK_ADS = 'FACEBOOK_ADS',
  SEO = 'SEO',
  REFERRAL = 'REFERRAL',
  EMERGENCY_HOTLINE = 'EMERGENCY_HOTLINE',
}

registerEnumType(LeadStatus, { name: 'LeadStatus' });
registerEnumType(PracticeArea, { name: 'PracticeArea' });
registerEnumType(UrgencyLevel, { name: 'UrgencyLevel' });
registerEnumType(LeadSource, { name: 'LeadSource' });

@ObjectType()
@Entity('leads')
@Index(['practiceArea', 'status'])
@Index(['createdAt', 'urgencyLevel'])
@Index(['zipCode', 'practiceArea'])
export class Lead {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Contact Information
  @Field()
  @Column()
  @MinLength(2)
  firstName!: string;

  @Field()
  @Column()
  @MinLength(2)
  lastName!: string;

  @Field()
  @Column()
  @IsEmail()
  email!: string;

  @Field()
  @Column()
  @IsPhoneNumber('US')
  phone!: string;

  @Field()
  @Column()
  city!: string;

  @Field()
  @Column()
  state!: string;

  @Field()
  @Column({ length: 10 })
  zipCode!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  address?: string;

  // Case Details
  @Field(() => PracticeArea)
  @Column({
    type: 'enum',
    enum: PracticeArea,
  })
  practiceArea!: PracticeArea;

  @Field()
  @Column({ type: 'text' })
  caseDescription!: string;

  @Field(() => UrgencyLevel)
  @Column({
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.MEDIUM,
  })
  urgencyLevel!: UrgencyLevel;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  incidentDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  statuteOfLimitationsDate?: Date;

  // AI Scoring and Qualification
  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  qualificationScore!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedCaseValue!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  conversionProbability!: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  leadScore!: number;

  // Financial Information
  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  annualIncome?: number;

  @Field({ nullable: true })
  @Column({ type: 'boolean', nullable: true })
  hasInsurance?: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  insuranceProvider?: string;

  // Status and Tracking
  @Field(() => LeadStatus)
  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status!: LeadStatus;

  @Field(() => LeadSource)
  @Column({
    type: 'enum',
    enum: LeadSource,
    default: LeadSource.WEBSITE,
  })
  source!: LeadSource;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  utmSource?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  utmMedium?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  utmCampaign?: string;

  // Medical Information (for PI cases)
  @Field({ nullable: true })
  @Column({ type: 'boolean', nullable: true })
  hasMedicalTreatment?: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  medicalProvider?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  medicalBills?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  injuries?: string;

  // Document Attachments
  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  attachments?: string[];

  // Geolocation
  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // Relationships
  @Field(() => Lawyer, { nullable: true })
  @ManyToOne(() => Lawyer, lawyer => lawyer.leads, { nullable: true })
  @JoinColumn()
  matchedLawyer?: Lawyer;

  @Field({ nullable: true })
  @Column({ nullable: true })
  matchedLawyerId?: string;

  @Field(() => Case, { nullable: true })
  @ManyToOne(() => Case, { nullable: true })
  @JoinColumn()
  case?: Case;

  @Field({ nullable: true })
  @Column({ nullable: true })
  caseId?: string;

  @Field(() => [LeadInteraction])
  @OneToMany(() => LeadInteraction, interaction => interaction.lead)
  interactions!: LeadInteraction[];

  // Metadata
  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Timestamps
  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  contactedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  matchedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  convertedAt?: Date;

  // Computed fields for GraphQL
  @Field()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Field()
  get isEmergency(): boolean {
    return this.urgencyLevel === UrgencyLevel.EMERGENCY;
  }

  @Field()
  get ageInHours(): number {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
  }

  @Field()
  get isPastStatuteOfLimitations(): boolean {
    if (!this.statuteOfLimitationsDate) return false;
    return new Date() > this.statuteOfLimitationsDate;
  }
}