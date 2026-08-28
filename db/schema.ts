import { pgTable, text, integer, real, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ---------------------------------------------------------------------------
// Postgres schema (via drizzle-orm/pg-core + node-postgres). Production
// requires Postgres rather than SQLite because the web app and the
// mass-email worker (workers/email-worker.ts) run as separate processes —
// a local SQLite file can't be shared between them. For local dev, run
// Postgres via `docker compose up -d` (see docker-compose.yml) or any local
// Postgres install, and point DATABASE_URL at it.
// ---------------------------------------------------------------------------

export const ROLES = ["ADMIN", "MANAGER", "RECRUITER"] as const;
export type Role = (typeof ROLES)[number];

export const REQUIREMENT_STATUSES = ["OPEN", "ON_HOLD", "FILLED", "CLOSED"] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const EMPLOYMENT_TYPES = ["W2", "C2C", "C1099", "FULL_TIME"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const SUBMISSION_STATUSES = [
  "SUBMITTED",
  "INTERNAL_REVIEW",
  "SUBMITTED_TO_CLIENT",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "OFFER",
  "PLACED",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const CANDIDATE_SOURCES = [
  "INTERNAL",
  "REFERRAL",
  "DICE",
  "LINKEDIN",
  "MONSTER",
  "INDEED",
  "CAREERBUILDER",
  "ZIPRECRUITER",
  "OTHER",
] as const;
export type CandidateSource = (typeof CANDIDATE_SOURCES)[number];

export const JOB_BOARD_PROVIDERS = [
  "DICE",
  "LINKEDIN",
  "MONSTER",
  "INDEED",
  "CAREERBUILDER",
  "ZIPRECRUITER",
] as const;
export type JobBoardProvider = (typeof JOB_BOARD_PROVIDERS)[number];

export const STORAGE_PROVIDERS = ["LOCAL", "ZOHO_WORKDRIVE"] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

export const DOCUMENT_ENTITY_TYPES = ["CANDIDATE", "REQUIREMENT", "SUBMISSION"] as const;
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export const EMAIL_CAMPAIGN_STATUSES = ["QUEUED", "PROCESSING", "SENT", "PARTIAL", "FAILED"] as const;
export type EmailCampaignStatus = (typeof EMAIL_CAMPAIGN_STATUSES)[number];

export const EMAIL_RECIPIENT_STATUSES = ["PENDING", "SENT", "FAILED"] as const;
export type EmailRecipientStatus = (typeof EMAIL_RECIPIENT_STATUSES)[number];

const id = () => text("id").primaryKey().$defaultFn(() => createId());
const createdAt = () =>
  timestamp("created_at", { mode: "date" }).notNull().$defaultFn(() => new Date());
const updatedAt = () =>
  timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLES }).notNull().default("RECRUITER"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const clients = pgTable("clients", {
  id: id(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: createdAt(),
});

export const requirements = pgTable("requirements", {
  id: id(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skills: text("skills").notNull().default(""), // comma-separated
  location: text("location").notNull().default(""),
  employmentType: text("employment_type", { enum: EMPLOYMENT_TYPES }).notNull().default("W2"),
  rateMin: real("rate_min"),
  rateMax: real("rate_max"),
  positions: integer("positions").notNull().default(1),
  priority: text("priority", { enum: PRIORITIES }).notNull().default("MEDIUM"),
  status: text("status", { enum: REQUIREMENT_STATUSES }).notNull().default("OPEN"),
  dueDate: timestamp("due_date", { mode: "date" }),
  clientId: text("client_id").notNull().references(() => clients.id),
  postedById: text("posted_by_id").notNull().references(() => users.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const requirementAssignees = pgTable(
  "requirement_assignees",
  {
    id: id(),
    requirementId: text("requirement_id").notNull().references(() => requirements.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id),
    assignedAt: createdAt(),
  },
  (t) => ({
    uniq: unique().on(t.requirementId, t.userId),
  })
);

export const candidates = pgTable("candidates", {
  id: id(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  currentTitle: text("current_title"),
  skills: text("skills").notNull().default(""),
  experienceYears: real("experience_years"),
  location: text("location"),
  workAuthorization: text("work_authorization"),
  resumeUrl: text("resume_url"), // convenience cache of the latest resume document's URL
  source: text("source", { enum: CANDIDATE_SOURCES }).notNull().default("INTERNAL"),
  externalId: text("external_id"),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const submissions = pgTable(
  "submissions",
  {
    id: id(),
    candidateId: text("candidate_id").notNull().references(() => candidates.id),
    requirementId: text("requirement_id").notNull().references(() => requirements.id),
    submittedById: text("submitted_by_id").notNull().references(() => users.id),
    submittedRate: real("submitted_rate"),
    status: text("status", { enum: SUBMISSION_STATUSES }).notNull().default("SUBMITTED"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    uniq: unique().on(t.candidateId, t.requirementId),
  })
);

export const submissionStatusHistory = pgTable("submission_status_history", {
  id: id(),
  submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  fromStatus: text("from_status", { enum: SUBMISSION_STATUSES }),
  toStatus: text("to_status", { enum: SUBMISSION_STATUSES }).notNull(),
  changedById: text("changed_by_id").references(() => users.id),
  changedAt: createdAt(),
});

// Polymorphic note/activity log — attach to a requirement, candidate, or submission.
export const notes = pgTable("notes", {
  id: id(),
  body: text("body").notNull(),
  authorId: text("author_id").notNull().references(() => users.id),
  requirementId: text("requirement_id").references(() => requirements.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id").references(() => candidates.id, { onDelete: "cascade" }),
  submissionId: text("submission_id").references(() => submissions.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

// Job board integrations (Dice, LinkedIn, ...) — credentials placeholder until
// the company is an approved API/data partner with that board. See
// lib/integrations/README.md.
export const jobBoardIntegrations = pgTable("job_board_integrations", {
  id: id(),
  provider: text("provider", { enum: JOB_BOARD_PROVIDERS }).notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  credentials: text("credentials"), // JSON string, e.g. { apiKey, accountId }
  config: text("config"), // JSON string, e.g. sync filters/frequency
  lastSyncAt: timestamp("last_sync_at", { mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const importedCandidateLogs = pgTable("imported_candidate_logs", {
  id: id(),
  integrationId: text("integration_id").notNull().references(() => jobBoardIntegrations.id),
  externalId: text("external_id").notNull(),
  rawPayload: text("raw_payload").notNull(), // JSON string snapshot
  status: text("status").notNull(), // "stubbed" | "imported" | "matched" | "error"
  candidateId: text("candidate_id").references(() => candidates.id),
  createdAt: createdAt(),
});

// Document storage — resumes and other files, backed by a StorageAdapter
// (Zoho WorkDrive is real/functional once credentials are supplied; LOCAL is
// a fully-working filesystem fallback for dev/demo).
export const storageIntegrations = pgTable("storage_integrations", {
  id: id(),
  provider: text("provider", { enum: STORAGE_PROVIDERS }).notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  credentials: text("credentials"), // JSON string, e.g. { clientId, clientSecret, refreshToken, rootFolderId }
  config: text("config"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const documents = pgTable("documents", {
  id: id(),
  entityType: text("entity_type", { enum: DOCUMENT_ENTITY_TYPES }).notNull(),
  entityId: text("entity_id").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  category: text("category").notNull().default("OTHER"), // e.g. RESUME, OFFER_LETTER, ID_PROOF
  storageProvider: text("storage_provider", { enum: STORAGE_PROVIDERS }).notNull().default("LOCAL"),
  externalFileId: text("external_file_id"), // id of the file at the storage provider (e.g. Zoho WorkDrive file id)
  externalFolderId: text("external_folder_id"),
  url: text("url"), // download/view URL (local path or Zoho permalink)
  uploadedById: text("uploaded_by_id").notNull().references(() => users.id),
  createdAt: createdAt(),
});

// Amazon SES config for mass email — real/functional once credentials are
// supplied, same as Zoho WorkDrive (AWS SES has an open, self-serve API; no
// partner agreement needed, just an AWS account with SES set up).
export const mailSettings = pgTable("mail_settings", {
  id: id(),
  provider: text("provider").notNull().default("SES").unique(),
  enabled: boolean("enabled").notNull().default(false),
  region: text("region"),
  accessKeyId: text("access_key_id"),
  secretAccessKey: text("secret_access_key"), // placeholder storage — use a secrets manager / IAM role in production
  fromEmail: text("from_email"),
  fromName: text("from_name"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// A mass-email send is queued, not executed inline — see lib/queue/. This row
// is the campaign header; each recipient gets its own row in
// email_campaign_recipients, updated by the background worker as it works
// through the queue at a throttled rate.
export const emailCampaigns = pgTable("email_campaigns", {
  id: id(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
  status: text("status", { enum: EMAIL_CAMPAIGN_STATUSES }).notNull().default("QUEUED"),
  sentById: text("sent_by_id").notNull().references(() => users.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const emailCampaignRecipients = pgTable("email_campaign_recipients", {
  id: id(),
  campaignId: text("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id").references(() => candidates.id),
  email: text("email").notNull(),
  name: text("name"),
  status: text("status", { enum: EMAIL_RECIPIENT_STATUSES }).notNull().default("PENDING"),
  error: text("error"),
  sentAt: timestamp("sent_at", { mode: "date" }),
});

// ---------------------------------------------------------------------------
// Relations (used for Drizzle's relational query API)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  clientsOwned: many(clients),
  requirementsPosted: many(requirements),
  assignments: many(requirementAssignees),
  candidatesOwned: many(candidates),
  submissionsMade: many(submissions),
  notes: many(notes),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  owner: one(users, { fields: [clients.ownerId], references: [users.id] }),
  requirements: many(requirements),
}));

export const requirementsRelations = relations(requirements, ({ one, many }) => ({
  client: one(clients, { fields: [requirements.clientId], references: [clients.id] }),
  postedBy: one(users, { fields: [requirements.postedById], references: [users.id] }),
  assignees: many(requirementAssignees),
  submissions: many(submissions),
  notes: many(notes),
}));

export const requirementAssigneesRelations = relations(requirementAssignees, ({ one }) => ({
  requirement: one(requirements, { fields: [requirementAssignees.requirementId], references: [requirements.id] }),
  user: one(users, { fields: [requirementAssignees.userId], references: [users.id] }),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  owner: one(users, { fields: [candidates.ownerId], references: [users.id] }),
  submissions: many(submissions),
  notes: many(notes),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  candidate: one(candidates, { fields: [submissions.candidateId], references: [candidates.id] }),
  requirement: one(requirements, { fields: [submissions.requirementId], references: [requirements.id] }),
  submittedBy: one(users, { fields: [submissions.submittedById], references: [users.id] }),
  statusHistory: many(submissionStatusHistory),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  author: one(users, { fields: [notes.authorId], references: [users.id] }),
  requirement: one(requirements, { fields: [notes.requirementId], references: [requirements.id] }),
  candidate: one(candidates, { fields: [notes.candidateId], references: [candidates.id] }),
  submission: one(submissions, { fields: [notes.submissionId], references: [submissions.id] }),
}));

export const submissionStatusHistoryRelations = relations(submissionStatusHistory, ({ one }) => ({
  submission: one(submissions, { fields: [submissionStatusHistory.submissionId], references: [submissions.id] }),
}));

export const jobBoardIntegrationsRelations = relations(jobBoardIntegrations, ({ many }) => ({
  importLogs: many(importedCandidateLogs),
}));

export const importedCandidateLogsRelations = relations(importedCandidateLogs, ({ one }) => ({
  integration: one(jobBoardIntegrations, { fields: [importedCandidateLogs.integrationId], references: [jobBoardIntegrations.id] }),
  candidate: one(candidates, { fields: [importedCandidateLogs.candidateId], references: [candidates.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  uploadedBy: one(users, { fields: [documents.uploadedById], references: [users.id] }),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({ one, many }) => ({
  sentBy: one(users, { fields: [emailCampaigns.sentById], references: [users.id] }),
  recipients: many(emailCampaignRecipients),
}));

export const emailCampaignRecipientsRelations = relations(emailCampaignRecipients, ({ one }) => ({
  campaign: one(emailCampaigns, { fields: [emailCampaignRecipients.campaignId], references: [emailCampaigns.id] }),
  candidate: one(candidates, { fields: [emailCampaignRecipients.candidateId], references: [candidates.id] }),
}));
