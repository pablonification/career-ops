"use client";

import { useEffect, useState } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { ScoreBadge } from "./score-badge";

type ScoredItem = {
  id: string;
  url: string;
  title: string | null;
  company: string | null;
  score: number;
  legitimacy: "High" | "Medium" | "Low";
  tier: string;
};

export function ScoredTable() {
  const [items, setItems] = useState<ScoredItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/explore/scored");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        // SAFETY: /api/explore returns {ok, data} per api-helpers contract
        const data = (await res.json()) as { ok: boolean; data: ScoredItem[] };
        if (data.ok) {
          setItems(data.data);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <IconLoader2 className="size-4 animate-spin" /> Loading scored pipeline…
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">No scored items yet — run a scan to populate.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-surface/50 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2">Company</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Score</th>
            <th className="px-3 py-2">Tier</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-t hover:bg-surface/30">
              <td className="px-3 py-2">{it.company ?? "—"}</td>
              <td className="px-3 py-2">{it.title ?? it.url.slice(0, 40)}</td>
              <td className="px-3 py-2">
                <ScoreBadge score={it.score} legitimacy={it.legitimacy} tier={it.tier} />
              </td>
              <td className="px-3 py-2 text-xs">{it.tier}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
