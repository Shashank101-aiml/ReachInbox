export interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export type EmailStatus = "pending" | "scheduled" | "sending" | "sent" | "failed";

export interface ScheduledEmail {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  scheduledFor: string;
  status: EmailStatus;
}

export interface SentEmail {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  sentAt: string | null;
  status: Extract<EmailStatus, "sent" | "failed">;
  error: string | null;
}

export interface ScheduleCampaignResponse {
  campaignId: number;
  scheduledCount: number;
  invalidCount: number;
}

export interface ParseLeadsResponse {
  totalDetected: number;
  invalidCount: number;
  sample: string[];
}
