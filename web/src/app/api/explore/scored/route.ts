import { getRequestId, apiOk } from "@/server/api-helpers";
import { requireTenant } from "@/server/auth/tenant";
import { getDb } from "@/server/db/client";
import { pipelineItems } from "@/server/db/schema";
import { scoreJob, legitimacyTier } from "@/server/scoring/scorer";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const requestId = getRequestId(request.headers);
  const tenantResult = await requireTenant(request.headers, requestId);
  if (tenantResult instanceof Response) {
    return tenantResult;
  }
  const db = getDb();
  const items = await db
    .select()
    .from(pipelineItems)
    .where(eq(pipelineItems.tenantId, tenantResult.organizationId));
  const cvText = "TypeScript React Next.js Node PostgreSQL Drizzle better-auth Xendit";
  const scored = items.map((item) => {
    const desc = item.title ?? item.url;
    const result = scoreJob(desc, cvText);
    return {
      id: item.id,
      url: item.url,
      title: item.title,
      company: item.company,
      score: result.score,
      legitimacy: result.legitimacy,
      tier: legitimacyTier(result.score, result.legitimacy),
      reasons: result.reasons,
    };
  });
  return apiOk(scored, requestId);
}
