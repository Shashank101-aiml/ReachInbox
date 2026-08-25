import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "@/middleware/auth";
import { parseLeads } from "@/services/leadParser";
import { createCampaignAndSchedule, listScheduledEmails, listSentEmails } from "@/services/emailService";

export const emailsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const scheduleSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  startTime: z.coerce.date(),
  delayMs: z.coerce.number().int().nonnegative(),
  hourlyLimit: z.coerce.number().int().nonnegative(),
});

emailsRouter.post("/leads/parse", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing file (multipart field 'file')" });
  }
  const result = parseLeads(req.file.buffer, req.file.originalname);
  res.json({
    totalDetected: result.totalDetected,
    invalidCount: result.invalidCount,
    sample: result.emails.slice(0, 5),
  });
});

emailsRouter.post("/schedule", requireAuth, upload.single("file"), async (req: AuthedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing file (multipart field 'file')" });
  }

  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const leads = parseLeads(req.file.buffer, req.file.originalname);
  if (leads.emails.length === 0) {
    return res.status(400).json({ error: "No valid email addresses found in the uploaded file" });
  }

  const result = await createCampaignAndSchedule({
    userId: req.user!.id,
    subject: parsed.data.subject,
    body: parsed.data.body,
    recipients: leads.emails,
    startTime: parsed.data.startTime,
    delayMs: parsed.data.delayMs,
    hourlyLimit: parsed.data.hourlyLimit,
  });

  res.status(201).json({
    campaignId: result.campaignId,
    scheduledCount: result.scheduledCount,
    invalidCount: leads.invalidCount,
  });
});

emailsRouter.get("/scheduled", requireAuth, async (_req, res) => {
  const items = await listScheduledEmails();
  res.json({ items });
});

emailsRouter.get("/sent", requireAuth, async (_req, res) => {
  const items = await listSentEmails();
  res.json({ items });
});
