import { getRequestId, apiOk, apiError } from "@/server/api-helpers";
import { isDuplicateWebhook, recordWebhookEvent, verifyWebhookToken } from "@/server/billing/xendit";
import { getDb } from "@/server/db/client";
import { tenants } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookBody = {
  id: string;
  external_id: string;
  status: string;
};

export async function POST(request: Request): Promise<Response> {
  const requestId = getRequestId(request.headers);
  if (!verifyWebhookToken(request.headers)) {
    return apiError("UNAUTHORIZED", "Invalid webhook token", requestId, 401);
  }
  // SAFETY: Xendit webhook body shape is {id, external_id, status} per Xendit docs, validated by presence checks below
  const body = (await request.json()) as WebhookBody;
  const eventId = body.id;
  if (eventId === undefined || eventId.length === 0) {
    return apiError("INVALID_REQUEST", "Missing event id", requestId, 400);
  }
  const duplicate = await isDuplicateWebhook(eventId);
  if (duplicate) {
    return apiOk({ received: true, duplicate: true }, requestId);
  }
  const tenantId = body.external_id;
  let status = body.status;
  if (status === "PAID" || status === "COMPLETED") {
    status = "active";
  } else if (status === "EXPIRED" || status === "FAILED") {
    status = "expired";
  }
  if (tenantId !== undefined && tenantId.length > 0) {
    const db = getDb();
    await db
      .update(tenants)
      .set({ subscriptionStatus: status })
      .where(eq(tenants.id, tenantId));
  }
  // SAFETY: WebhookBody fields are all strings, safe to store as Record<string, string>
  await recordWebhookEvent(eventId, tenantId ?? null, status, body as Record<string, string>);
  return apiOk({ received: true }, requestId);
}
