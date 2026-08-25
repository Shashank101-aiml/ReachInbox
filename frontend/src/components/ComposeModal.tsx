"use client";

import { ChangeEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { api, ApiError } from "@/lib/api";
import type { ParseLeadsResponse, ScheduleCampaignResponse } from "@/types";

interface SenderOption {
  id: string;
  email: string;
  fromName: string;
}

interface ComposeModalProps {
  onClose: () => void;
  onScheduled: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function tomorrowAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function ComposeModal({ onClose, onScheduled }: ComposeModalProps) {
  const [senders, setSenders] = useState<SenderOption[]>([]);
  const [senderId, setSenderId] = useState("");

  const [toInput, setToInput] = useState("");
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);
  const [uploadedInvalid, setUploadedInvalid] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");

  const [delaySeconds, setDelaySeconds] = useState(0);
  const [hourlyLimit, setHourlyLimit] = useState(0);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [customDateTime, setCustomDateTime] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ items: SenderOption[] }>("/api/senders")
      .then((res) => {
        setSenders(res.items);
        if (res.items[0]) setSenderId(res.items[0].id);
      })
      .catch(() => {
        // Sender dropdown just stays empty — scheduling still works via server-side round-robin assignment.
      });
  }, []);

  function addChip() {
    const value = toInput.trim().replace(/,$/, "");
    if (value && EMAIL_RE.test(value) && !toEmails.includes(value)) {
      setToEmails((prev) => [...prev, value]);
    }
    setToInput("");
  }

  function handleToKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip();
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api.postForm<ParseLeadsResponse>("/api/emails/leads/parse", form);
      setUploadedCount(result.totalDetected);
      setUploadedInvalid(result.invalidCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to parse the uploaded file");
      setUploadedFile(null);
      setUploadedCount(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeUpload() {
    setUploadedFile(null);
    setUploadedCount(null);
    setUploadedInvalid(null);
  }

  function pickPreset(date: Date) {
    setStartTime(date);
    setScheduleOpen(false);
  }

  function confirmCustom() {
    if (customDateTime) setStartTime(new Date(customDateTime));
    setScheduleOpen(false);
  }

  const visibleChips = toEmails.slice(0, 3);
  const overflowCount = toEmails.length - visibleChips.length;

  async function handleSubmit() {
    setError(null);

    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (!uploadedFile && toEmails.length === 0) {
      setError("Add at least one recipient.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      const file = uploadedFile ?? new File([toEmails.join("\n")], "recipients.txt", { type: "text/plain" });
      form.append("file", file);
      form.append("subject", subject);
      form.append("body", bodyHtml || "");
      form.append("startTime", (startTime ?? new Date()).toISOString());
      form.append("delayMs", String(Math.max(0, delaySeconds) * 1000));
      form.append("hourlyLimit", String(Math.max(0, hourlyLimit)));

      await api.postForm<ScheduleCampaignResponse>("/api/emails/schedule", form);
      onScheduled();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to schedule the campaign.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} widthClassName="max-w-2xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <button type="button" onClick={onClose} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
          <BackIcon className="h-4 w-4" />
          <span className="text-base font-medium">Compose New Email</span>
        </button>
        <div className="flex items-center gap-3">
          <button type="button" title="Attach" className="text-gray-400 hover:text-gray-600">
            <PaperclipIcon className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              title="Send later"
              onClick={() => setScheduleOpen((v) => !v)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ClockIcon className="h-4 w-4" />
            </button>
            {scheduleOpen && (
              <SendLaterPopover
                customDateTime={customDateTime}
                onCustomDateTimeChange={setCustomDateTime}
                onPreset={pickPreset}
                onCancel={() => setScheduleOpen(false)}
                onDone={confirmCustom}
              />
            )}
          </div>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Scheduling…" : startTime ? "Send Later" : "Send"}
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <FieldRow label="From">
          <select
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            className="w-full rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {senders.length === 0 && <option value="">No senders configured</option>}
            {senders.map((s) => (
              <option key={s.id} value={s.id}>
                {s.email}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="To">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1.5">
              {visibleChips.map((email) => (
                <Chip key={email} label={email} onRemove={() => setToEmails((prev) => prev.filter((e) => e !== email))} />
              ))}
              {overflowCount > 0 && <span className="text-xs font-medium text-gray-500">+{overflowCount}</span>}
              <input
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={handleToKeyDown}
                onBlur={addChip}
                placeholder={toEmails.length === 0 && !uploadedFile ? "recipient@example.com" : ""}
                className="min-w-[140px] flex-1 bg-transparent py-0.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="ml-auto flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <UploadIcon className="h-3.5 w-3.5" /> Upload List
              </button>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
            </div>
            {uploading && <p className="mt-1 text-xs text-gray-400">Parsing file…</p>}
            {uploadedFile && uploadedCount !== null && !uploading && (
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span>
                  📎 {uploadedFile.name} — {uploadedCount} email address{uploadedCount === 1 ? "" : "es"} detected
                  {uploadedInvalid ? `, ${uploadedInvalid} invalid` : ""}
                </span>
                <button type="button" onClick={removeUpload} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
            )}
          </div>
        </FieldRow>

        <FieldRow label="Subject">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        </FieldRow>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Delay between 2 emails
            <input
              type="number"
              min={0}
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(Number(e.target.value))}
              className="w-16 rounded-md bg-gray-100 px-2 py-1.5 text-center text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Hourly Limit
            <input
              type="number"
              min={0}
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(Number(e.target.value))}
              className="w-16 rounded-md bg-gray-100 px-2 py-1.5 text-center text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
        </div>

        <RichTextEditor onChange={setBodyHtml} />
      </div>
    </Modal>
  );
}

function SendLaterPopover({
  customDateTime,
  onCustomDateTimeChange,
  onPreset,
  onCancel,
  onDone,
}: {
  customDateTime: string;
  onCustomDateTimeChange: (v: string) => void;
  onPreset: (d: Date) => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const presets = [
    { label: "Tomorrow", date: tomorrowAt(9, 0) },
    { label: "Tomorrow, 10:00 AM", date: tomorrowAt(10, 0) },
    { label: "Tomorrow, 11:00 AM", date: tomorrowAt(11, 0) },
    { label: "Tomorrow, 3:00 PM", date: tomorrowAt(15, 0) },
  ];

  return (
    <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-gray-900">Send Later</p>
      <input
        type="datetime-local"
        value={customDateTime}
        onChange={(e) => onCustomDateTimeChange(e.target.value)}
        className="mb-2 w-full rounded-md bg-gray-100 px-2 py-1.5 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <div className="mb-2 space-y-0.5">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onPreset(p.date)}
            className="block w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full border border-emerald-500 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-16 shrink-0 pt-2 text-sm text-gray-500">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M11 5.5l-4.5 4.5a2 2 0 002.8 2.8l4.5-4.5a3.5 3.5 0 00-5-5L4 8a5 5 0 007 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 11V3M8 3L5 6M8 3l3 3M3 13h10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
