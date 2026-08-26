import { auth } from "./auth";
import { apiForbidden, apiUnauthorized } from "../api-helpers";

export type TenantContext = {
  userId: string;
  organizationId: string;
};

export async function requireTenant(
  headers: Headers,
  requestId: string,
): Promise<TenantContext | Response> {
  const sessionResult = await auth.api.getSession({ headers });
  if (sessionResult === null) {
    return apiUnauthorized(requestId);
  }
  const userId = sessionResult.user.id;
  const activeOrgId = sessionResult.session.activeOrganizationId;
  if (activeOrgId === null || activeOrgId === undefined || activeOrgId.length === 0) {
    return apiForbidden(requestId);
  }
  const context: TenantContext = { userId, organizationId: activeOrgId };
  return context;
}

export function isTenantContext(value: TenantContext | Response): value is TenantContext {
  return value instanceof Response === false;
}
