import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { applications } from "@/server/db/schema";
import { getRequestId, apiOk } from "@/server/api-helpers";
import { requireTenant } from "@/server/auth/tenant";

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
  return apiOk(rows, requestId);
}
