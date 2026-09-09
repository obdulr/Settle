import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum CrmLeadSource {
  WEBSITE = 'website',
  SOCIAL = 'social',
  REFERRAL = 'referral',
  ADVERTISING = 'advertising',
  COLD_OUTREACH = 'cold_outreach',
  EVENT = 'event',
  ASSESSMENT = 'assessment',
  PROVIDER_SIGNUP = 'provider_signup',
}

export enum CrmLeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  NURTURING = 'nurturing',
}

export enum CrmLeadGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
}

@Entity('crm_leads')
export class CrmLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  company?: string;

  @Column({ name: 'job_title', nullable: true })
  jobTitle?: string;

  @Column({
    type: 'enum',
    enum: CrmLeadSource,
  })
  source: CrmLeadSource;

  @Column({
    type: 'enum',
    enum: CrmLeadStatus,
    default: CrmLeadStatus.NEW,
  })
  status: CrmLeadStatus;

  @Column('int', { default: 0 })
  score: number;

  @Column('decimal', { precision: 5, scale: 2, name: 'ai_score', nullable: true })
  aiScore?: number;

  @Column({
    type: 'enum',
    enum: CrmLeadGrade,
    name: 'ai_grade',
    nullable: true,
  })
  aiGrade?: CrmLeadGrade;

  @Column('text', { array: true, default: [] })
  aiInsights?: string[];

  @Column('text', { array: true, name: 'ai_recommended_actions', default: [] })
  aiRecommendedActions?: string[];

  @Column({ type: 'timestamp', name: 'last_scored_at', nullable: true })
  lastScoredAt?: Date;

  @Column({ name: 'webinar_attendance', default: false })
  webinarAttendance: boolean;

  @Column({ name: 'pricing_page_visits', default: 0 })
  pricingPageVisits: number;

  @Column({ name: 'email_opens', default: 0 })
  emailOpens: number;

  @Column({ name: 'email_clicks', default: 0 })
  emailClicks: number;

  @Column({ name: 'website_visits', default: 0 })
  websiteVisits: number;

  @Column({ name: 'content_downloads', default: 0 })
  contentDownloads: number;

  @Column({ name: 'form_submissions', default: 0 })
  formSubmissions: number;

  @Column({ name: 'demo_requests', default: 0 })
  demoRequests: number;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  // Optional link to an existing consumer lead in the marketplace
  @Column({ name: 'consumer_lead_id', nullable: true })
  consumerLeadId?: string;

  // Grouping id — can be provider, campaign, or team
  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
