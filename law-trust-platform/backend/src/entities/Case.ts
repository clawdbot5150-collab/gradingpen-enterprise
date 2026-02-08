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
import { Lawyer } from './Lawyer';
import { Lead, PracticeArea } from './Lead';
import { CaseUpdate } from './CaseUpdate';

export enum CaseStatus {
  OPEN = 'OPEN',
  IN_NEGOTIATION = 'IN_NEGOTIATION',
  SETTLED = 'SETTLED',
  WON = 'WON',
  LOST = 'LOST',
  DISMISSED = 'DISMISSED',
  CLOSED = 'CLOSED',
}

export enum CaseType {
  CONTINGENCY = 'CONTINGENCY',
  HOURLY = 'HOURLY',
  FLAT_FEE = 'FLAT_FEE',
  MIXED = 'MIXED',
}

registerEnumType(CaseStatus, { name: 'CaseStatus' });
registerEnumType(CaseType, { name: 'CaseType' });

@ObjectType()
@Entity('cases')
@Index(['status', 'lawyer'])
@Index(['practiceArea', 'status'])
export class Case {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ unique: true })
  caseNumber!: string;

  @Field()
  @Column()
  title!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => PracticeArea)
  @Column({
    type: 'enum',
    enum: PracticeArea,
  })
  practiceArea!: PracticeArea;

  @Field(() => CaseStatus)
  @Column({
    type: 'enum',
    enum: CaseStatus,
    default: CaseStatus.OPEN,
  })
  status!: CaseStatus;

  @Field(() => CaseType)
  @Column({
    type: 'enum',
    enum: CaseType,
    default: CaseType.CONTINGENCY,
  })
  caseType!: CaseType;

  // Financial Information
  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedValue?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  settlementAmount?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  attorneyFees?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  contingencyPercentage?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalHours?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expenses?: number;

  // Important Dates
  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  incidentDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  filingDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  statuteOfLimitationsDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  trialDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  settlementDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  closedDate?: Date;

  // Court Information
  @Field({ nullable: true })
  @Column({ nullable: true })
  courtName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  judgeName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  caseFilingNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  jurisdiction?: string;

  // Parties
  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  plaintiff?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  defendant?: string;

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  otherParties?: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  opposingCounsel?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  opposingCounselFirm?: string;

  // Client Information
  @Field()
  @Column()
  clientName!: string;

  @Field()
  @Column()
  clientEmail!: string;

  @Field()
  @Column()
  clientPhone!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  clientAddress?: string;

  // Case Progress
  @Field(() => Int)
  @Column({ default: 0 })
  progressPercentage!: number;

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  milestones?: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  completedMilestones?: string[];

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  nextCourtDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  nextAction?: string;

  // Documents and Evidence
  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  documents?: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  evidence?: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  medicalRecords?: string[];

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  photographs?: string[];

  // Communication Logs
  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastClientContact?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  lastClientContactNote?: string;

  // Risk Assessment
  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50 })
  winProbability!: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  riskFactors?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  strengthsOfCase?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  weaknessesOfCase?: string;

  // Lead Information
  @Field(() => Lead, { nullable: true })
  @ManyToOne(() => Lead, { nullable: true })
  @JoinColumn()
  originalLead?: Lead;

  @Field({ nullable: true })
  @Column({ nullable: true })
  originalLeadId?: string;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  leadCost?: number;

  // Relationships
  @Field(() => Lawyer)
  @ManyToOne(() => Lawyer, lawyer => lawyer.cases)
  @JoinColumn()
  lawyer!: Lawyer;

  @Column()
  lawyerId!: string;

  @Field(() => [CaseUpdate])
  @OneToMany(() => CaseUpdate, update => update.case)
  updates!: CaseUpdate[];

  // Metadata
  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  privateNotes?: string;

  // Timestamps
  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;

  // Computed fields for GraphQL
  @Field()
  get isActive(): boolean {
    return this.status === CaseStatus.OPEN || this.status === CaseStatus.IN_NEGOTIATION;
  }

  @Field()
  get daysOpen(): number {
    const endDate = this.closedDate || new Date();
    return Math.floor((endDate.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  @Field(() => Float)
  get netSettlement(): number {
    if (!this.settlementAmount) return 0;
    const fees = this.attorneyFees || 0;
    const expenses = this.expenses || 0;
    return this.settlementAmount - fees - expenses;
  }

  @Field(() => Float)
  get roi(): number {
    if (!this.leadCost || !this.attorneyFees) return 0;
    return ((this.attorneyFees - this.leadCost) / this.leadCost) * 100;
  }

  @Field()
  get isPastStatuteOfLimitations(): boolean {
    if (!this.statuteOfLimitationsDate) return false;
    return new Date() > this.statuteOfLimitationsDate;
  }

  @Field()
  get daysUntilStatuteOfLimitations(): number {
    if (!this.statuteOfLimitationsDate) return -1;
    const today = new Date();
    const diffTime = this.statuteOfLimitationsDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  @Field()
  get isHighValue(): boolean {
    const threshold = 100000; // $100K
    return (this.estimatedValue || this.settlementAmount || 0) >= threshold;
  }
}