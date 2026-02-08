import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from 'type-graphql';
import { IsEmail, MinLength, Max, Min } from 'class-validator';
import { Lawyer } from './Lawyer';
import { Case } from './Case';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export enum ReviewSource {
  CLIENT_PORTAL = 'CLIENT_PORTAL',
  EMAIL_INVITE = 'EMAIL_INVITE',
  SMS_INVITE = 'SMS_INVITE',
  PHONE_FOLLOW_UP = 'PHONE_FOLLOW_UP',
  THIRD_PARTY = 'THIRD_PARTY',
}

registerEnumType(ReviewStatus, { name: 'ReviewStatus' });
registerEnumType(ReviewSource, { name: 'ReviewSource' });

@ObjectType()
@Entity('lawyer_reviews')
@Index(['lawyer', 'status'])
@Index(['rating', 'createdAt'])
export class LawyerReview {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Review Content
  @Field(() => Int)
  @Column()
  @Min(1)
  @Max(5)
  rating!: number;

  @Field()
  @Column({ type: 'text' })
  @MinLength(10)
  reviewText!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  title?: string;

  // Reviewer Information
  @Field()
  @Column()
  reviewerName!: string;

  @Field()
  @Column()
  @IsEmail()
  reviewerEmail!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewerPhone?: string;

  @Field()
  @Column({ default: true })
  isVerifiedClient!: boolean;

  // Detailed Ratings (1-5 scale)
  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  @Min(1)
  @Max(5)
  responsivenessRating?: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  @Min(1)
  @Max(5)
  expertiseRating?: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  @Min(1)
  @Max(5)
  valueRating?: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  @Min(1)
  @Max(5)
  professionalismRating?: number;

  // Review Metadata
  @Field(() => ReviewStatus)
  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status!: ReviewStatus;

  @Field(() => ReviewSource)
  @Column({
    type: 'enum',
    enum: ReviewSource,
    default: ReviewSource.CLIENT_PORTAL,
  })
  source!: ReviewSource;

  @Field()
  @Column({ default: false })
  isAnonymous!: boolean;

  @Field()
  @Column({ default: true })
  wouldRecommend!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  mostHelpfulAspect?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  areasForImprovement?: string;

  // Moderation
  @Field({ nullable: true })
  @Column({ nullable: true })
  moderatedBy?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  moderatedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  moderationNotes?: string;

  @Field()
  @Column({ default: false })
  isFlagged!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  flagReason?: string;

  // Response from Lawyer
  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  lawyerResponse?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lawyerResponseDate?: Date;

  // Publication
  @Field()
  @Column({ default: true })
  isPublished!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  // Helpful votes
  @Field(() => Int)
  @Column({ default: 0 })
  helpfulVotes!: number;

  @Field(() => Int)
  @Column({ default: 0 })
  notHelpfulVotes!: number;

  // Relationships
  @Field(() => Lawyer)
  @ManyToOne(() => Lawyer, lawyer => lawyer.reviews)
  @JoinColumn()
  lawyer!: Lawyer;

  @Column()
  lawyerId!: string;

  @Field(() => Case, { nullable: true })
  @ManyToOne(() => Case, { nullable: true })
  @JoinColumn()
  case?: Case;

  @Field({ nullable: true })
  @Column({ nullable: true })
  caseId?: string;

  // Metadata
  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Timestamps
  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;

  // Computed fields
  @Field(() => Int)
  get helpfulnessScore(): number {
    const total = this.helpfulVotes + this.notHelpfulVotes;
    return total > 0 ? Math.round((this.helpfulVotes / total) * 100) : 0;
  }

  @Field()
  get isRecent(): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.createdAt > thirtyDaysAgo;
  }

  @Field(() => Int)
  get ageInDays(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}