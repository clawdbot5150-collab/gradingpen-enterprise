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
import { Lead } from './Lead';
import { Lawyer } from './Lawyer';

export enum InteractionType {
  PHONE_CALL = 'PHONE_CALL',
  EMAIL_SENT = 'EMAIL_SENT',
  EMAIL_RECEIVED = 'EMAIL_RECEIVED',
  SMS_SENT = 'SMS_SENT',
  SMS_RECEIVED = 'SMS_RECEIVED',
  MEETING = 'MEETING',
  VIDEO_CALL = 'VIDEO_CALL',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  NOTE_ADDED = 'NOTE_ADDED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  LAWYER_ASSIGNED = 'LAWYER_ASSIGNED',
  FOLLOW_UP = 'FOLLOW_UP',
  CONSULTATION_SCHEDULED = 'CONSULTATION_SCHEDULED',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
}

registerEnumType(InteractionType, { name: 'InteractionType' });

@ObjectType()
@Entity('lead_interactions')
@Index(['lead', 'createdAt'])
@Index(['lawyer', 'createdAt'])
export class LeadInteraction {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => InteractionType)
  @Column({
    type: 'enum',
    enum: InteractionType,
  })
  type!: InteractionType;

  @Field()
  @Column({ type: 'text' })
  description!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  details?: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Duration for calls/meetings (in minutes)
  @Field({ nullable: true })
  @Column({ nullable: true })
  durationMinutes?: number;

  // Outcome or result of interaction
  @Field({ nullable: true })
  @Column({ nullable: true })
  outcome?: string;

  // Follow-up required
  @Field()
  @Column({ default: false })
  followUpRequired!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  followUpDate?: Date;

  // System vs Human initiated
  @Field()
  @Column({ default: false })
  isSystemGenerated!: boolean;

  // Relationships
  @Field(() => Lead)
  @ManyToOne(() => Lead, lead => lead.interactions)
  @JoinColumn()
  lead!: Lead;

  @Column()
  leadId!: string;

  @Field(() => Lawyer, { nullable: true })
  @ManyToOne(() => Lawyer, { nullable: true })
  @JoinColumn()
  lawyer?: Lawyer;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lawyerId?: string;

  // User who created the interaction (for manual entries)
  @Field({ nullable: true })
  @Column({ nullable: true })
  createdByUserId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  createdByUserName?: string;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;
}