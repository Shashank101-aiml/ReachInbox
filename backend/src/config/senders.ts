import { senderIds } from "./env";

export interface SenderConfig {
  id: string;
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
}

function readSender(id: string): SenderConfig {
  const prefix = `SENDER_${id.toUpperCase()}_`;
  const host = process.env[`${prefix}HOST`];
  const port = process.env[`${prefix}PORT`];
  const user = process.env[`${prefix}USER`];
  const pass = process.env[`${prefix}PASS`];
  const fromName = process.env[`${prefix}FROM_NAME`] ?? id;

  if (!host || !port || !user || !pass) {
    throw new Error(
      `Missing SMTP config for sender "${id}". Expected env vars ${prefix}HOST, ${prefix}PORT, ${prefix}USER, ${prefix}PASS`
    );
  }

  return { id, host, port: Number(port), user, pass, fromName };
}

export function getSenders(): SenderConfig[] {
  return senderIds.map(readSender);
}

export function getSender(id: string): SenderConfig {
  return readSender(id);
}
