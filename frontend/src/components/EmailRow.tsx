import { StatusBadge } from "@/components/StatusBadge";
import { stripHtml, truncate } from "@/lib/format";
import type { EmailStatus } from "@/types";

export interface EmailRowData {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledFor?: string;
}

export function EmailRow({ recipient, subject, body, status, scheduledFor }: EmailRowData) {
  return (
    <div className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
      <span className="w-48 shrink-0 truncate text-sm text-gray-900">
        <span className="text-gray-500">To:</span> {recipient}
      </span>
      <StatusBadge status={status} scheduledFor={scheduledFor} />
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium text-gray-900">{subject}</span>
        <span className="text-gray-400"> · {truncate(stripHtml(body), 60)}</span>
      </span>
      <button
        type="button"
        aria-label="Star"
        className="shrink-0 text-gray-300 hover:text-amber-400"
      >
        <StarIcon />
      </button>
    </div>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.5l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L10 2.5z"
        stroke="currentColor"
      />
    </svg>
  );
}
