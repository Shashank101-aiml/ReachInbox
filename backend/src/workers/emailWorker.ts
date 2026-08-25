import { Worker, Job, DelayedError } from "bullmq";
import { eq } from "drizzle-orm";
import { redisConnection } from "@/queues/connection";
import { EMAIL_QUEUE_NAME, EmailJobData } from "@/queues/emailQueue";
import { env } from "@/config/env";
import { db } from "@/db/client";
import { scheduledEmails } from "@/db/schema";
import { checkAndConsume } from "@/services/rateLimiter";
import { sendEmail } from "@/services/smtpService";

async function processEmailJob(job: Job<EmailJobData>, token?: string) {
  const [row] = await db
    .select()
    .from(scheduledEmails)
    .where(eq(scheduledEmails.id, job.data.scheduledEmailId));

  if (!row) {
    console.warn(`[worker] scheduled email ${job.data.scheduledEmailId} not found, skipping`);
    return;
  }
  if (row.status === "sent") {
    console.log(`[worker] scheduled email ${row.id} already sent, skipping`);
    return;
  }

  const rate = await checkAndConsume({
    senderId: job.data.senderId,
    campaignId: job.data.campaignId,
    campaignHourlyLimit: job.data.campaignHourlyLimit,
  });

  if (!rate.allowed) {
    // Hourly cap hit: don't fail or drop the job, push it into the next hour
    // window instead. Reflect the new time on the row so the dashboard stays accurate.
    await db
      .update(scheduledEmails)
      .set({ scheduledFor: rate.retryAt })
      .where(eq(scheduledEmails.id, row.id));

    if (!token) {
      throw new Error("Rate limited but worker gave no token to delay the job");
    }
    await job.moveToDelayed(rate.retryAt.getTime(), token);
    throw new DelayedError();
  }

  await db.update(scheduledEmails).set({ status: "sending" }).where(eq(scheduledEmails.id, row.id));

  try {
    const result = await sendEmail({
      senderId: job.data.senderId,
      to: row.recipient,
      subject: row.subject,
      body: row.body,
    });
    await db
      .update(scheduledEmails)
      .set({
        status: "sent",
        sentAt: new Date(),
        error: null,
        meta: { previewUrl: result.previewUrl, messageId: result.messageId },
      })
      .where(eq(scheduledEmails.id, row.id));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(scheduledEmails)
      .set({ status: "failed", error: message })
      .where(eq(scheduledEmails.id, row.id));
    throw err; // BullMQ retries per emailQueue's defaultJobOptions (attempts/backoff)
  }
}

export const emailWorker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, {
  connection: redisConnection,
  concurrency: env.WORKER_CONCURRENCY,
 
  limiter: { max: 1, duration: env.MIN_DELAY_BETWEEN_EMAILS_MS },
});

emailWorker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message);
});

console.log(
  `[worker] email worker started with concurrency=${env.WORKER_CONCURRENCY}, minDelayMs=${env.MIN_DELAY_BETWEEN_EMAILS_MS}`
);
