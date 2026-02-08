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
import { ObjectType, Field, ID, Float, registerEnumType } from 'type-graphql';
import { Lawyer, SubscriptionTier } from './Lawyer';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
  TRIALING = 'TRIALING',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  PAYPAL = 'PAYPAL',
}

export enum BillingPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
}

registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });
registerEnumType(BillingPeriod, { name: 'BillingPeriod' });

@ObjectType()
@Entity('subscriptions')
@Index(['lawyer', 'status'])
@Index(['currentPeriodEnd'])
export class Subscription {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Subscription Details
  @Field(() => SubscriptionTier)
  @Column({
    type: 'enum',
    enum: SubscriptionTier,
  })
  tier!: SubscriptionTier;

  @Field(() => SubscriptionStatus)
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status!: SubscriptionStatus;

  @Field(() => BillingPeriod)
  @Column({
    type: 'enum',
    enum: BillingPeriod,
    default: BillingPeriod.MONTHLY,
  })
  billingPeriod!: BillingPeriod;

  // Pricing
  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount!: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  // Trial Information
  @Field()
  @Column({ default: false })
  isTrialing!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  trialStartDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  trialEndDate?: Date;

  // Billing Dates
  @Field()
  @Column()
  currentPeriodStart!: Date;

  @Field()
  @Column()
  currentPeriodEnd!: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  nextBillingDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastBillingDate?: Date;

  // Payment Information
  @Field(() => PaymentMethod)
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CREDIT_CARD,
  })
  paymentMethod!: PaymentMethod;

  // Stripe/Payment Gateway IDs
  @Field({ nullable: true })
  @Column({ nullable: true })
  stripeSubscriptionId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  stripeCustomerId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  paymentMethodId?: string;

  // Cancellation
  @Field()
  @Column({ default: false })
  cancelAtPeriodEnd!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  // Add-ons and Usage
  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  addOns?: Record<string, any>;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  usageCharges!: number;

  // Lead Limits and Usage
  @Field({ nullable: true })
  @Column({ nullable: true })
  maxLeadsPerMonth?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  leadsUsedThisMonth?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  maxTeamMembers?: number;

  // Features Enabled
  @Field()
  @Column({ default: true })
  hasBasicCRM!: boolean;

  @Field()
  @Column({ default: false })
  hasAdvancedAnalytics!: boolean;

  @Field()
  @Column({ default: false })
  hasPrioritySupport!: boolean;

  @Field()
  @Column({ default: false })
  hasAPIAccess!: boolean;

  @Field()
  @Column({ default: false })
  hasCustomBranding!: boolean;

  @Field()
  @Column({ default: false })
  hasExclusiveTerritories!: boolean;

  // Auto-renewal
  @Field()
  @Column({ default: true })
  autoRenew!: boolean;

  // Relationships
  @Field(() => Lawyer)
  @ManyToOne(() => Lawyer, lawyer => lawyer.subscriptions)
  @JoinColumn()
  lawyer!: Lawyer;

  @Column()
  lawyerId!: string;

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

  // Computed fields
  @Field()
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || 
           this.status === SubscriptionStatus.TRIALING;
  }

  @Field()
  get daysUntilRenewal(): number {
    const now = new Date();
    const diffTime = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  @Field()
  get isNearRenewal(): boolean {
    return this.daysUntilRenewal <= 7;
  }

  @Field(() => Float)
  get effectiveMonthlyPrice(): number {
    let monthlyPrice = this.totalAmount;
    
    if (this.billingPeriod === BillingPeriod.QUARTERLY) {
      monthlyPrice = this.totalAmount / 3;
    } else if (this.billingPeriod === BillingPeriod.ANNUALLY) {
      monthlyPrice = this.totalAmount / 12;
    }
    
    return Math.round(monthlyPrice * 100) / 100;
  }

  @Field()
  get canReceiveLeads(): boolean {
    return this.isActive && 
           (!this.maxLeadsPerMonth || 
            !this.leadsUsedThisMonth || 
            this.leadsUsedThisMonth < this.maxLeadsPerMonth);
  }
}