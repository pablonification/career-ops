import { getRequestId, apiOk, apiError } from "@/server/api-helpers";
import { classifyGmailSubject, matchGmailToApplication } from "@/server/gmail/watch";
import { getDb } from "@/server/db/client";
import { applications, statusLedger } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GmailPayload = {
  from: string;
  subject: string;
  fromDomain: string;
};

export async function POST(request: Request): Promise<Response> {
  const requestId = getRequestId(request.headers);
  // Gmail webhooks are service-to-service; no tenant session, but we validate via shared secret header
  const secret = request.headers.get("x-gmail-secret");
  const expected = process.env.GMAIL_WEBHOOK_SECRET ?? "";
  if (expected.length > 0 && secret !== expected) {
    return apiError("UNAUTHORIZED", "Invalid Gmail secret", requestId, 401);
  }
  // SAFETY: Gmail push payload is {from, subject, fromDomain} per Gmail API, validated below
  const body = (await request.json()) as GmailPayload;
  if (body.subject === undefined || body.subject.length === 0 || body.fromDomain === undefined) {
    return apiError("INVALID_REQUEST", "Missing Gmail fields", requestId, 400);
  }
  const classification = classifyGmailSubject(body.subject);
  if (classification === "other") {
    return apiOk({ classified: "other" }, requestId);
  }
  const db = getDb();
  // For webhook, we cannot know tenant without session; we search across all tenants' apps by company domain
  // In production, this would be scoped via Gmail account linkage; here we do a simple global search for demo
  const allApps = await db.select().from(applications);
  const matches = allApps.map((a) => ({ applicationId: a.id, company: a.company }));
  const match = matchGmailToApplication(body.fromDomain, matches);
  if (match === null) {
    return apiOk({ classified: classification, matched: false }, requestId);
  }
  const targetStatus = classification === "interview" ? "Interview" : "Rejected";
  await db.update(applications).set({ status: targetStatus }).where(eq(applications.id, match.applicationId));
  const ledgerId = crypto.randomUUID();
  // Find tenant for ledger via application
  const appRow = allApps.find((a) => a.id === match.applicationId);
  const tenantId = appRow?.tenantId ?? "";
  if (tenantId.length > 0) {
    await db.insert(statusLedger).values({
      id: ledgerId,
      tenantId,
      applicationId: match.applicationId,
      fromStatus: appRow?.status ?? null,
      toStatus: targetStatus,
      source: "gmail",
    });
  }
  return apiOk({ classified: classification, matched: true, status: targetStatus }, requestId);
}
