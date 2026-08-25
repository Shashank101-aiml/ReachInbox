import { Queue } from "bullmq";
import { redisConnection } from "./connection";
export const EMAIL_QUEUE_NAME = "email-send";
export interface EmailJobData {
  scheduledEmailId: number;
  recipient: string;
  subject: string;
  body: string;
  senderId: string;
  campaignId: number;
  campaignHourlyLimit: number;
}
export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});
