import { desc, eq, inArray } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { campaigns, scheduledEmails, EmailStatus } from "@/db/schema";
import { emailQueue, EmailJobData } from "@/queues/emailQueue";
import { assignSender } from "@/services/smtpService";
import { env } from "@/config/env";

const INSERT_BATCH_SIZE = 500;
const QUEUE_BATCH_SIZE = 1000;

export interface CreateCampaignInput {
  userId: number;
  subject: string;
  body: string;
  recipients: string[];
  startTime: Date;
  delayMs: number;
  hourlyLimit: number;
}

export interface CreateCampaignResult {
  campaignId: number;
  scheduledCount: number;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
export async function createCampaignAndSchedule(
  input: CreateCampaignInput
): Promise<CreateCampaignResult> {
  const effectiveDelayMs = Math.max(input.delayMs, env.MIN_DELAY_BETWEEN_EMAILS_MS);

  const [campaign] = await db
    .insert(campaigns)
    .values({
      userId: input.userId,
      subject: input.subject,
      body: input.body,
      startTime: input.startTime,
      delayMs: effectiveDelayMs,
      hourlyLimit: input.hourlyLimit,
    })
    .returning();

  const insertedIds: { id: number; recipient: string; scheduledFor: Date; senderId: string }[] = [];

  for (const batch of chunk(input.recipients, INSERT_BATCH_SIZE)) {
    const values = batch.map((recipient, i) => {
      const globalIndex = insertedIds.length + i;
      return {
        campaignId: campaign.id,
        recipient,
        subject: input.subject,
        body: input.body,
        senderId: assignSender(globalIndex),
        scheduledFor: new Date(input.startTime.getTime() + globalIndex * effectiveDelayMs),
        status: "scheduled" as EmailStatus,
      };
    });
    const inserted = await db
      .insert(scheduledEmails)
      .values(values)
      .returning({
        id: scheduledEmails.id,
        recipient: scheduledEmails.recipient,
        scheduledFor: scheduledEmails.scheduledFor,
        senderId: scheduledEmails.senderId,
      });
    insertedIds.push(...(inserted as { id: number; recipient: string; scheduledFor: Date; senderId: string }[]));
  }

  await pool.query(
    `UPDATE scheduled_emails SET bull_job_id = 'scheduled-email-' || id::text WHERE campaign_id = $1`,
    [campaign.id]
  );

  const now = Date.now();
  for (const idBatch of chunk(insertedIds, QUEUE_BATCH_SIZE)) {
    const jobs = idBatch.map((row) => ({
      name: "send",
      data: {
        scheduledEmailId: row.id,
        recipient: row.recipient,
        subject: input.subject,
        body: input.body,
        senderId: row.senderId,
        campaignId: campaign.id,
        campaignHourlyLimit: input.hourlyLimit,
      } satisfies EmailJobData,
      opts: {
        jobId: `scheduled-email-${row.id}`,
        delay: Math.max(0, row.scheduledFor.getTime() - now),
      },
    }));
    await emailQueue.addBulk(jobs);
  }

  return { campaignId: campaign.id, scheduledCount: insertedIds.length };
}

export interface ScheduledEmailListItem {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  scheduledFor: Date;
  status: EmailStatus;
}

export async function listScheduledEmails(limit = 200): Promise<ScheduledEmailListItem[]> {
  return db
    .select({
      id: scheduledEmails.id,
      recipient: scheduledEmails.recipient,
      subject: scheduledEmails.subject,
      body: scheduledEmails.body,
      scheduledFor: scheduledEmails.scheduledFor,
      status: scheduledEmails.status,
    })
    .from(scheduledEmails)
    .where(inArray(scheduledEmails.status, ["scheduled", "pending", "sending"]))
    .orderBy(scheduledEmails.scheduledFor)
    .limit(limit);
}

export interface SentEmailListItem {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  sentAt: Date | null;
  status: EmailStatus;
  error: string | null;
}

export async function listSentEmails(limit = 200): Promise<SentEmailListItem[]> {
  return db
    .select({
      id: scheduledEmails.id,
      recipient: scheduledEmails.recipient,
      subject: scheduledEmails.subject,
      body: scheduledEmails.body,
      sentAt: scheduledEmails.sentAt,
      status: scheduledEmails.status,
      error: scheduledEmails.error,
    })
    .from(scheduledEmails)
    .where(inArray(scheduledEmails.status, ["sent", "failed"]))
    .orderBy(desc(scheduledEmails.createdAt))
    .limit(limit);
}
