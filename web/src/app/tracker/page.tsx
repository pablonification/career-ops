import { Kanban } from "@/components/tracker/kanban";
import { IconLayoutKanban } from "@tabler/icons-react";

export const dynamic = "force-dynamic";

export default function TrackerPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <IconLayoutKanban className="size-5" />
        <h1 className="text-xl font-semibold">Tracker</h1>
        <span className="text-sm text-muted">Kanban + Gmail Watch</span>
      </div>
      <Kanban />
      <div className="mt-8 rounded-xl border bg-surface/30 p-4">
        <h2 className="text-sm font-semibold">Gmail Watch</h2>
        <p className="mt-1 text-xs text-muted">
          Connect Gmail to auto-classify recruiter replies. Interview → Interview, Rejection → Rejected. Webhook at
          <code className="mx-1 rounded bg-surface px-1 py-0.5">/api/gmail/webhook</code> with <code>x-gmail-secret</code>.
        </p>
      </div>
    </div>
  );
}
