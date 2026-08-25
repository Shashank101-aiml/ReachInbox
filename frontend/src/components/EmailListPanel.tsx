"use client";

import { useMemo, useState } from "react";
import { EmailRow, EmailRowData } from "@/components/EmailRow";

interface EmailListPanelProps {
  items: EmailRowData[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  emptyLabel: string;
}

export function EmailListPanel({ items, loading, error, onRefresh, emptyLabel }: EmailListPanelProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.recipient.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-md bg-gray-100 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh"
          className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <RefreshIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <StatusMessage text="Loading…" />}
        {!loading && error && <StatusMessage text={error} tone="error" />}
        {!loading && !error && filtered.length === 0 && (
          <StatusMessage text={query ? "No matches." : emptyLabel} />
        )}
        {!loading &&
          !error &&
          filtered.map((item) => <EmailRow key={item.id} {...item} />)}
      </div>
    </div>
  );
}

function StatusMessage({ text, tone = "default" }: { text: string; tone?: "default" | "error" }) {
  return (
    <p className={`px-4 py-8 text-center text-sm ${tone === "error" ? "text-red-600" : "text-gray-400"}`}>
      {text}
    </p>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="9" cy="9" r="6" stroke="currentColor" />
      <path d="M17 17l-4-4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M4 10a6 6 0 0110-4.2M16 10a6 6 0 01-10 4.2M14 3v3h-3M6 17v-3h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
