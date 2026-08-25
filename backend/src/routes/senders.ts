import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { getSenders } from "@/config/senders";
export const sendersRouter = Router();
sendersRouter.get("/", requireAuth, (_req, res) => {
  const senders = getSenders().map((s) => ({ id: s.id, email: s.user, fromName: s.fromName }));
  res.json({ items: senders });
});
