import { formatBadgeTime } from "@/lib/format";
import type { EmailStatus } from "@/types";

export function StatusBadge({ status, scheduledFor }: { status: EmailStatus; scheduledFor?: string }) {
  if (status === "scheduled" && scheduledFor) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <ClockIcon /> {formatBadgeTime(scheduledFor)}
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        Failed
      </span>
    );
  }

  if (status === "sending") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
        Sending
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      Sent
    </span>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
