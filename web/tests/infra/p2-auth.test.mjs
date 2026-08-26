import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../../");
const webRoot = resolve(root, "web");

function read(rel) {
  return readFileSync(resolve(webRoot, rel), "utf8");
}

test("auth-schema generated with pg tables and organization", () => {
  assert.ok(existsSync(resolve(webRoot, "src/server/db/auth-schema.ts")));
  const s = read("src/server/db/auth-schema.ts");
  assert.match(s, /pgTable\(\s*"user"/);
  assert.match(s, /pgTable\(\s*"organization"/);
  assert.match(s, /pgTable\(\s*"member"/);
  assert.match(s, /activeOrganizationId/);
});

test("api-helpers exports requestId and response contract", () => {
  const h = read("src/server/api-helpers.ts");
  assert.match(h, /export function getRequestId/);
  assert.match(h, /x-request-id/);
  assert.match(h, /export function apiOk/);
  assert.match(h, /ok:\s*true/);
  assert.match(h, /export function apiUnauthorized/);
  assert.match(h, /401/);
  assert.match(h, /export function apiForbidden/);
  assert.match(h, /403/);
  assert.match(h, /crypto\.randomUUID/);
});

test("tenant helper enforces 401 and 403", () => {
  const t = read("src/server/auth/tenant.ts");
  assert.match(t, /export async function requireTenant/);
  assert.match(t, /apiUnauthorized/);
  assert.match(t, /apiForbidden/);
  assert.match(t, /activeOrganizationId/);
  assert.match(t, /organizationId/);
  assert.doesNotMatch(t, /typeof/);
});

test("auth route uses better-auth toNextJsHandler", () => {
  assert.ok(existsSync(resolve(webRoot, "src/app/api/auth/[...all]/route.ts")));
  const r = read("src/app/api/auth/[...all]/route.ts");
  assert.match(r, /toNextJsHandler/);
  assert.match(r, /from "better-auth\/next-js"/);
  assert.match(r, /export const GET/);
  assert.match(r, /export const POST/);
});

test("applications route is tenant-scoped and returns 401/403 via requireTenant", () => {
  const a = read("src/app/api/applications/route.ts");
  assert.match(a, /requireTenant/);
  assert.match(a, /getRequestId/);
  assert.match(a, /eq\(applications\.tenantId,\s*tenantResult\.organizationId\)/);
  assert.match(a, /instanceof Response/);
  assert.match(a, /apiOk/);
  assert.doesNotMatch(a, /pipelineSummary/);
});

test("drizzle config includes both schemas", () => {
  const d = read("drizzle.config.ts");
  assert.match(d, /schema\.ts/);
  assert.match(d, /auth-schema\.ts/);
});

test("auth client and sign-in page use Tabler and shadcn", () => {
  assert.ok(existsSync(resolve(webRoot, "src/lib/auth-client.ts")));
  const c = read("src/lib/auth-client.ts");
  assert.match(c, /createAuthClient/);
  assert.match(c, /organizationClient/);
  const p = read("src/app/(auth)/sign-in/page.tsx");
  assert.match(p, /IconLogin/);
  assert.match(p, /@tabler\/icons-react/);
  assert.match(p, /SignInForm/);
  const f = read("src/components/auth/sign-in-form.tsx");
  assert.match(f, /IconLoader2/);
  assert.match(f, /authClient\.signIn\.email/);
  const o = read("src/components/org-switch.tsx");
  assert.match(o, /IconBuilding/);
  assert.match(o, /IconSelector/);
  assert.match(o, /authClient\.organization\.list/);
  assert.match(o, /setActive/);
});

test("proxy still guards origin and tenant helper is separate (no mixed concerns)", () => {
  const p = readFileSync(resolve(webRoot, "src/proxy.ts"), "utf8");
  assert.match(p, /checkRequest/);
  assert.match(p, /sec-fetch-site/);
  // tenant check is in api-helpers/tenant, not in proxy — separation of concerns
  assert.doesNotMatch(p, /requireTenant/);
});
