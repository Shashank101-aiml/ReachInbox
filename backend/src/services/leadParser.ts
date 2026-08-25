import { parse } from "csv-parse/sync";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface ParsedLeads {
  emails: string[];
  totalDetected: number;
  invalidCount: number;
}

function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

function extractFromCsv(content: string): string[] {
  let rows: string[][];
  try {
    rows = parse(content, {
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    }) as string[][];
  } catch {
    return [];
  }

  if (rows.length === 0) return [];

  const header = rows[0];
  const emailColIdx = header.findIndex((cell) => /^email(\s*address)?$/i.test(cell.trim()));

  if (emailColIdx !== -1) {
    return rows.slice(1).map((row) => row[emailColIdx]).filter(Boolean);
  }

  const candidates: string[] = [];
  for (const row of rows) {
    for (const cell of row) {
      if (cell) candidates.push(cell);
    }
  }
  return candidates;
}

function extractFromPlainText(content: string): string[] {
  return content.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
}

export function parseLeads(fileContent: Buffer, filename: string): ParsedLeads {
  const text = fileContent.toString("utf-8");
  const looksLikeCsv = filename.toLowerCase().endsWith(".csv") || text.includes(",");

  const candidates = looksLikeCsv ? extractFromCsv(text) : extractFromPlainText(text);

  const seen = new Set<string>();
  let invalidCount = 0;

  for (const candidate of candidates) {
    const normalized = candidate.trim().toLowerCase();
    if (!normalized || normalized === "email" || normalized === "email address") continue; // header row
    if (!isEmail(normalized)) {
      invalidCount++;
      continue;
    }
    seen.add(normalized);
  }

  const emails = Array.from(seen);
  return { emails, totalDetected: emails.length, invalidCount };
}
