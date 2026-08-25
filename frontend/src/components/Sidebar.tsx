"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import type { User } from "@/types";

export type DashboardTab = "scheduled" | "sent";

interface SidebarProps {
  user: User;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  scheduledCount: number;
  sentCount: number;
  onCompose: () => void;
}

export function Sidebar({ user, activeTab, onTabChange, scheduledCount, sentCount, onCompose }: SidebarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api.post("/api/auth/logout");
    } finally {
      router.push("/");
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-4 pt-5 pb-4">
        <span className="text-2xl font-extrabold tracking-tight text-gray-900">ONB</span>
      </div>

      <div className="relative px-4">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-gray-50"
        >
          <Avatar name={user.name} src={user.avatarUrl} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-gray-900">{user.name}</span>
            <span className="block truncate text-xs text-gray-500">{user.email}</span>
          </span>
          <ChevronIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && (
          <div className="absolute left-4 right-4 top-full z-10 mt-1 rounded-md border border-gray-200 bg-white py-1 shadow-md">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={onCompose}
          className="w-full rounded-full border border-emerald-500 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
        >
          Compose
        </button>
      </div>

      <div className="mt-6 px-4">
        <p className="px-2 text-xs font-semibold tracking-wide text-gray-400">CORE</p>
        <nav className="mt-2 space-y-1">
          <NavItem
            label="Scheduled"
            count={scheduledCount}
            active={activeTab === "scheduled"}
            onClick={() => onTabChange("scheduled")}
            icon={<ClockIcon className="h-4 w-4" />}
          />
          <NavItem
            label="Sent"
            count={sentCount}
            active={activeTab === "sent"}
            onClick={() => onTabChange("sent")}
            icon={<SendIcon className="h-4 w-4" />}
          />
        </nav>
      </div>
    </aside>
  );
}

function NavItem({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-sm ${
        active ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={active ? "text-emerald-700" : "text-gray-400"}>{count}</span>
    </button>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
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

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M14.5 1.5L7.5 8.5M14.5 1.5L10 14.5l-2.5-6-6-2.5 12.5-4.5z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}
