import { getRequestId, apiOk, apiError } from "@/server/api-helpers";
import { requireTenant } from "@/server/auth/tenant";
import { createInvoice } from "@/server/billing/xendit";
import { checkQuota, isHostedMode } from "@/server/billing/quotas";
import { getDb } from "@/server/db/client";
import { tenants } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const requestId = getRequestId(request.headers);
  const tenantResult = await requireTenant(request.headers, requestId);
  if (tenantResult instanceof Response) {
    return tenantResult;
  }
  if (isHostedMode()) {
    const quota = await checkQuota(tenantResult.organizationId, tenantResult.userId, "2026-08", "checkout");
    if (!quota.allowed) {
      return apiError("QUOTA_EXCEEDED", "Quota exceeded", requestId, 402);
    }
  }
  const db = getDb();
  const tenantRows = await db.select().from(tenants).where(eq(tenants.id, tenantResult.organizationId));
  const tenant = tenantRows[0];
  const email = "billing@example.com";
  const externalId = tenantResult.organizationId;
  const amount = 20000;
  const description = "Career-ops managed billing";
  if (tenant !== undefined && tenant.xenditCustomerId !== null && tenant.xenditCustomerId.length > 0) {
    // existing customer, use same externalId
  }
  const invoice = await createInvoice({ externalId, amount, payerEmail: email, description });
  await db.update(tenants).set({ xenditInvoiceId: invoice.id }).where(eq(tenants.id, tenantResult.organizationId));
  return apiOk({ invoiceUrl: invoice.invoiceUrl, id: invoice.id }, requestId);
}
