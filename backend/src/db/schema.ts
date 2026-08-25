import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const emailStatusEnum = pgEnum("email_status", [
  "pending",
  "scheduled",
  "sending",
  "sent",
  "failed",
]);

export type EmailStatus = (typeof emailStatusEnum.enumValues)[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: varchar("google_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: varchar("subject", { length: 998 }).notNull(),
  body: text("body").notNull(),
  startTime: timestamp("start_time").notNull(),
  delayMs: integer("delay_ms").notNull(),
  hourlyLimit: integer("hourly_limit").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduledEmails = pgTable("scheduled_emails", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 998 }).notNull(),
  body: text("body").notNull(),
  senderId: varchar("sender_id", { length: 100 }),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: emailStatusEnum("status").default("scheduled").notNull(),
  // BullMQ job id backing this row — used to guarantee idempotency across restarts.
  bullJobId: varchar("bull_job_id", { length: 255 }).unique(),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
