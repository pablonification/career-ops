import { eq } from "drizzle-orm";
import { getRequestId, apiOk, apiError } from "@/server/api-helpers";
import { requireTenant } from "@/server/auth/tenant";
import { getDb } from "@/server/db/client";
import { applications, statusLedger } from "@/server/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const requestId = getRequestId(request.headers);
  const tenantResult = await requireTenant(request.headers, requestId);
  if (tenantResult instanceof Response) {
    return tenantResult;
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.tenantId, tenantResult.organizationId));
  const byStatus: Record<string, typeof rows> = {};
  for (const row of rows) {
    const key = row.status;
    if (byStatus[key] === undefined) {
      byStatus[key] = [];
    }
    byStatus[key].push(row);
  }
  return apiOk({ byStatus, total: rows.length }, requestId);
}

export async function POST(request: Request): Promise<Response> {
  const requestId = getRequestId(request.headers);
  const tenantResult = await requireTenant(request.headers, requestId);
  if (tenantResult instanceof Response) {
    return tenantResult;
  }
  // SAFETY: Kanban move payload is {id, status} per UI drag, validated by presence checks below
  const body = (await request.json()) as { id: string; status: string };
  if (body.id === undefined || body.id.length === 0 || body.status === undefined || body.status.length === 0) {
    return apiError("INVALID_REQUEST", "Missing id or status", requestId, 400);
  }
  const db = getDb();
  const existing = await db.select().from(applications).where(eq(applications.id, body.id));
  const app = existing[0];
  if (app === undefined || app.tenantId !== tenantResult.organizationId) {
    return apiError("NOT_FOUND", "Application not found", requestId, 404);
  }
  await db.update(applications).set({ status: body.status }).where(eq(applications.id, body.id));
  const ledgerId = crypto.randomUUID();
  await db.insert(statusLedger).values({
    id: ledgerId,
    tenantId: tenantResult.organizationId,
    applicationId: body.id,
    fromStatus: app.status,
    toStatus: body.status,
    source: "kanban",
  });
  return apiOk({ id: body.id, status: body.status }, requestId);
}
