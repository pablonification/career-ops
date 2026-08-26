"use client";

import { useEffect, useState } from "react";
import { IconLoader2, IconGripVertical } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

type Card = {
  id: string;
  company: string;
  role: string;
  status: string;
};

const COLUMNS = ["Evaluated", "Applied", "Interview", "Offer", "Rejected", "Discarded"];

export function Kanban() {
  const [byStatus, setByStatus] = useState<Record<string, Card[]>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/tracker");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    // SAFETY: /api/tracker returns {byStatus, total} per api-helpers
    const data = (await res.json()) as { ok: boolean; data: { byStatus: Record<string, Card[]> } };
    if (data.ok) {
      setByStatus(data.data.byStatus);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function move(id: string, status: string) {
    await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <IconLoader2 className="size-4 animate-spin" /> Loading tracker…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {COLUMNS.map((col) => (
        <div key={col} className="rounded-xl border bg-surface/30 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{col}</h3>
          <div className="space-y-2">
            {(byStatus[col] ?? []).map((card) => (
              <div key={card.id} className="rounded-lg border bg-card p-3 shadow-sm">
                <p className="text-sm font-medium">{card.company}</p>
                <p className="text-xs text-muted">{card.role}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge tone={col === "Offer" ? "good" : col === "Rejected" ? "bad" : "muted"}>{col}</Badge>
                  <button
                    onClick={() => move(card.id, "Interview")}
                    className="flex items-center gap-1 text-xs text-muted hover:text-brand"
                  >
                    <IconGripVertical className="size-3" /> Move
                  </button>
                </div>
              </div>
            ))}
            {(byStatus[col] ?? []).length === 0 && <p className="text-xs text-muted">—</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
