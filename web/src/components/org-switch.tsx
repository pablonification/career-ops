"use client";

import { useEffect, useState } from "react";
import { IconBuilding, IconSelector } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Org = { id: string; name: string; slug: string };

export function OrgSwitch() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    async function load() {
      const res = await authClient.organization.list();
      if (res.data !== null && res.data !== undefined) {
        // SAFETY: better-auth organization.list returns Org[] shape per API contract
        setOrgs(res.data as Org[]);
      }
      const session = await authClient.getSession();
      const active = session.data?.session.activeOrganizationId;
      if (active !== null && active !== undefined) {
        setActiveId(active);
      }
    }
    load();
  }, []);

  if (orgs.length === 0) {
    return null;
  }

  const active = orgs.find((o) => o.id === activeId) ?? orgs[0];

  async function switchOrg(id: string) {
    await authClient.organization.setActive({ organizationId: id });
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2">
      <IconBuilding className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">{active.name}</span>
      <select
        value={activeId}
        onChange={(e) => switchOrg(e.target.value)}
        className="rounded-md border px-2 py-1 text-sm"
        aria-label="Switch workspace"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <IconSelector className="size-4 text-muted-foreground" />
      <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/sign-in")}>
        Sign out
      </Button>
    </div>
  );
}
