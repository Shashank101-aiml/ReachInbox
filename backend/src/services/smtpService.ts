import nodemailer, { Transporter } from "nodemailer";
import { getSender, SenderConfig } from "@/config/senders";
import { senderIds } from "@/config/env";

const transporters = new Map<string, Transporter>();

function getTransporter(sender: SenderConfig): Transporter {
  let t = transporters.get(sender.id);
  if (!t) {
    t = nodemailer.createTransport({
      host: sender.host,
      port: sender.port,
      secure: sender.port === 465,
      auth: { user: sender.user, pass: sender.pass },
    });
    transporters.set(sender.id, t);
  }
  return t;
}

export function assignSender(index: number): string {
  if (senderIds.length === 0) {
    throw new Error("No SMTP senders configured (SMTP_SENDER_IDS is empty)");
  }
  return senderIds[index % senderIds.length];
}

export interface SendResult {
  messageId: string;
  previewUrl: string | false;
}

export async function sendEmail(params: {
  senderId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<SendResult> {
  const sender = getSender(params.senderId);
  const transporter = getTransporter(sender);

  const info = await transporter.sendMail({
    from: `"${sender.fromName}" <${sender.user}>`,
    to: params.to,
    subject: params.subject,
    text: params.body,
    html: `<p>${params.body.replace(/\n/g, "<br/>")}</p>`,
  });

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}
