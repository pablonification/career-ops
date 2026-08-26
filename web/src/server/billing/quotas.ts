import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { hostedUsageCounters } from "../db/schema";

export type QuotaCheckResult = {
  allowed: boolean;
  remaining: number;
};

export async function checkQuota(
  tenantId: string,
  userId: string,
  period: string,
  action: string,
): Promise<QuotaCheckResult> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hostedUsageCounters)
    .where(
      and(
        eq(hostedUsageCounters.tenantId, tenantId),
        eq(hostedUsageCounters.userId, userId),
        eq(hostedUsageCounters.period, period),
        eq(hostedUsageCounters.action, action),
      ),
    );
  if (rows.length === 0) {
    return { allowed: true, remaining: 9999 };
  }
  const row = rows[0];
  const used = row.usedUnits + row.reservedUnits;
  const remaining = row.limitUnits - used;
  return { allowed: remaining > 0, remaining };
}

export async function consumeQuota(
  tenantId: string,
  userId: string,
  period: string,
  action: string,
  amount: number,
): Promise<void> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hostedUsageCounters)
    .where(
      and(
        eq(hostedUsageCounters.tenantId, tenantId),
        eq(hostedUsageCounters.userId, userId),
        eq(hostedUsageCounters.period, period),
        eq(hostedUsageCounters.action, action),
      ),
    );
  if (rows.length === 0) {
    return;
  }
  const row = rows[0];
  await db
    .update(hostedUsageCounters)
    .set({ usedUnits: row.usedUnits + amount })
    .where(eq(hostedUsageCounters.id, row.id));
}

export function isHostedMode(): boolean {
  const mode = process.env.HOSTED_MODE;
  return mode === "true" || mode === "1";
}
