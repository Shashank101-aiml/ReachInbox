"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposeModal } from "@/components/ComposeModal";
import { EmailListPanel } from "@/components/EmailListPanel";
import { Sidebar, DashboardTab } from "@/components/Sidebar";
import { api, ApiError } from "@/lib/api";
import { useUser } from "@/lib/useUser";
import type { ScheduledEmail, SentEmail } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading, unauthenticated } = useUser();

  const [tab, setTab] = useState<DashboardTab>("scheduled");
  const [composeOpen, setComposeOpen] = useState(false);

  const [scheduled, setScheduled] = useState<ScheduledEmail[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [scheduledError, setScheduledError] = useState<string | null>(null);

  const [sent, setSent] = useState<SentEmail[]>([]);
  const [sentLoading, setSentLoading] = useState(true);
  const [sentError, setSentError] = useState<string | null>(null);

  const loadScheduled = useCallback(async () => {
    setScheduledLoading(true);
    setScheduledError(null);
    try {
      const res = await api.get<{ items: ScheduledEmail[] }>("/api/emails/scheduled");
      setScheduled(res.items);
    } catch (err) {
      setScheduledError(err instanceof ApiError ? err.message : "Failed to load scheduled emails.");
    } finally {
      setScheduledLoading(false);
    }
  }, []);

  const loadSent = useCallback(async () => {
    setSentLoading(true);
    setSentError(null);
    try {
      const res = await api.get<{ items: SentEmail[] }>("/api/emails/sent");
      setSent(res.items);
    } catch (err) {
      setSentError(err instanceof ApiError ? err.message : "Failed to load sent emails.");
    } finally {
      setSentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // Standard fetch-on-mount: each loader sets its own loading flag before
    // awaiting the request, which is the correct pattern despite the rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadScheduled();
    loadSent();
  }, [user, loadScheduled, loadSent]);

  useEffect(() => {
    if (unauthenticated) router.replace("/");
  }, [unauthenticated, router]);

  function handleScheduled() {
    loadScheduled();
    loadSent();
  }

  if (userLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-white">
      <Sidebar
        user={user}
        activeTab={tab}
        onTabChange={setTab}
        scheduledCount={scheduled.length}
        sentCount={sent.length}
        onCompose={() => setComposeOpen(true)}
      />

      {tab === "scheduled" ? (
        <EmailListPanel
          items={scheduled}
          loading={scheduledLoading}
          error={scheduledError}
          onRefresh={loadScheduled}
          emptyLabel="No scheduled emails yet. Click Compose to schedule your first campaign."
        />
      ) : (
        <EmailListPanel
          items={sent}
          loading={sentLoading}
          error={sentError}
          onRefresh={loadSent}
          emptyLabel="No emails sent yet."
        />
      )}

      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} onScheduled={handleScheduled} />}
    </div>
  );
}
