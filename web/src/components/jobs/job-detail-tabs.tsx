"use client";

import { useState } from "react";
import {
  IconFileText,
  IconTarget,
  IconCoin,
  IconPencil,
  IconUsers,
  IconShield,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";

type Tab = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: IconFileText },
  { id: "match", label: "Match", icon: IconTarget },
  { id: "comp", label: "Comp", icon: IconCoin },
  { id: "custom", label: "Custom", icon: IconPencil },
  { id: "interview", label: "Interview", icon: IconUsers },
  { id: "legitimacy", label: "Legitimacy", icon: IconShield },
];

export function JobDetailTabs({ jobId }: { jobId: string }) {
  const [active, setActive] = useState("overview");
  return (
    <div className="mt-6">
      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm",
              active === id ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl border bg-surface/40 p-4">
        <p className="text-sm text-muted">
          {active === "overview" && `Overview for ${jobId} — Blocks A summary, archetype, seniority, remote, TL;DR.`}
          {active === "match" && "Match — JD requirements mapped to CV lines, gaps and mitigations."}
          {active === "comp" && "Comp — advertised range, base, variable, reliability tier."}
          {active === "custom" && "Customization — Top 5 CV and LinkedIn changes."}
          {active === "interview" && "Interview — STAR+R stories, case study, red-flag answers."}
          {active === "legitimacy" && "Legitimacy — freshness, description quality, hiring signals, repost check."}
        </p>
      </div>
    </div>
  );
}
