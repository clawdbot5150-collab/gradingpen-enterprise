import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import { Case } from './Case';
import { Lawyer } from './Lawyer';

export enum UpdateType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  MILESTONE_COMPLETED = 'MILESTONE_COMPLETED',
  COURT_DATE_SCHEDULED = 'COURT_DATE_SCHEDULED',
  DOCUMENT_FILED = 'DOCUMENT_FILED',
  EVIDENCE_ADDED = 'EVIDENCE_ADDED',
  CLIENT_MEETING = 'CLIENT_MEETING',
  SETTLEMENT_OFFER = 'SETTLEMENT_OFFER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  EXPENSE_ADDED = 'EXPENSE_ADDED',
  NOTE_ADDED = 'NOTE_ADDED',
  TIME_ENTRY = 'TIME_ENTRY',
  PHONE_CALL = 'PHONE_CALL',
  EMAIL_SENT = 'EMAIL_SENT',
  RESEARCH_COMPLETED = 'RESEARCH_COMPLETED',
  DISCOVERY_COMPLETED = 'DISCOVERY_COMPLETED',
}

registerEnumType(UpdateType, { name: 'UpdateType' });

@ObjectType()
@Entity('case_updates')
@Index(['case', 'createdAt'])
@Index(['lawyer', 'createdAt'])
export class CaseUpdate {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => UpdateType)
  @Column({
    type: 'enum',
    enum: UpdateType,
  })
  type!: UpdateType;

  @Field()
  @Column()
  title!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  details?: string;

  // Time tracking (for time entries)
  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hoursWorked?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  hourlyRate?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount?: number;

  // Billable status
  @Field()
  @Column({ default: true })
  isBillable!: boolean;

  @Field()
  @Column({ default: false })
  isClientVisible!: boolean;

  // Documents and attachments
  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  attachments?: string[];

  // Important dates
  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  completedDate?: Date;

  // Client communication
  @Field()
  @Column({ default: false })
  requiresClientNotification!: boolean;

  @Field()
  @Column({ default: false })
  clientNotified!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  clientNotifiedAt?: Date;

  // Priority and urgency
  @Field()
  @Column({ default: false })
  isUrgent!: boolean;

  @Field()
  @Column({ default: false })
  isHighPriority!: boolean;

  // Relationships
  @Field(() => Case)
  @ManyToOne(() => Case, case => case.updates)
  @JoinColumn()
  case!: Case;

  @Column()
  caseId!: string;

  @Field(() => Lawyer)
  @ManyToOne(() => Lawyer)
  @JoinColumn()
  lawyer!: Lawyer;

  @Column()
  lawyerId!: string;

  // Metadata
  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  // Computed fields
  @Field()
  get isOverdue(): boolean {
    return this.dueDate ? new Date() > this.dueDate : false;
  }

  @Field()
  get isCompleted(): boolean {
    return !!this.completedDate;
  }

  @Field()
  get ageInDays(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}