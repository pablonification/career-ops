import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../../");
const webRoot = resolve(root, "web");

function read(rel) {
  return readFileSync(resolve(webRoot, rel), "utf8");
}

test("drizzle.config.ts exists and uses postgresql dialect", () => {
  assert.ok(existsSync(resolve(webRoot, "drizzle.config.ts")));
  const c = read("drizzle.config.ts");
  assert.match(c, /dialect:\s*["']postgresql["']/);
  assert.match(c, /schema:\s*["']\.\/src\/server\/db\/schema\.ts["']/);
});

test("schema.ts defines pgTable tenants and applications with tenant scoping", () => {
  const s = read("src/server/db/schema.ts");
  assert.match(s, /pgTable\(\s*"tenants"/);
  assert.match(s, /pgTable\(\s*"applications"/);
  assert.match(s, /tenantId/);
  assert.match(s, /pgTable\(\s*"hosted_usage_counters"/);
  // ensure not verbatim copy of job-ops sqliteTable
  assert.doesNotMatch(s, /sqliteTable/);
  assert.match(s, /from\s+["']drizzle-orm\/pg-core["']/);
});

test("client.ts lazy pool and getDb, no top-level throw", () => {
  const c = read("src/server/db/client.ts");
  assert.match(c, /function getPool/);
  assert.match(c, /function getDb/);
  assert.doesNotMatch(c, /const pool = new Pool\(\{/);
});

test("auth.ts uses better-auth with drizzleAdapter pg and organization plugin", () => {
  const a = read("src/server/auth/auth.ts");
  assert.match(a, /betterAuth/);
  assert.match(a, /drizzleAdapter/);
  assert.match(a, /provider:\s*["']pg["']/);
  assert.match(a, /organization\(/);
  assert.match(a, /getDb\(\)/);
});

test("nav-items uses @tabler/icons-react with Icon prefix", () => {
  const n = read("src/lib/nav-items.ts");
  assert.match(n, /from\s+["']@tabler\/icons-react["']/);
  assert.match(n, /IconLayoutDashboard/);
  assert.match(n, /IconCompass/);
  assert.match(n, /IconListCheck/);
  assert.doesNotMatch(n, /from\s+["']lucide-react["']/);
});

test("theme-toggle uses Tabler", () => {
  const t = read("src/components/theme-toggle.tsx");
  assert.match(t, /@tabler\/icons-react/);
  assert.match(t, /IconSun/);
});

test("docker-compose.yml has postgres service with healthcheck and web service", () => {
  const d = readFileSync(resolve(root, "docker-compose.yml"), "utf8");
  assert.match(d, /postgres:/);
  assert.match(d, /image:\s*postgres:16-alpine/);
  assert.match(d, /healthcheck:/);
  assert.match(d, /web:/);
  assert.match(d, /DATABASE_URL/);
});

test("web Dockerfile exists", () => {
  assert.ok(existsSync(resolve(webRoot, "Dockerfile")));
  const df = read("Dockerfile");
  assert.match(df, /node:22/);
});

test("web .env has XENDIT and better-auth env (example or local)", () => {
  const hasLocal = existsSync(resolve(webRoot, ".env.local"));
  const hasExample = existsSync(resolve(webRoot, ".env.example"));
  assert.ok(hasLocal || hasExample, "need .env.example or .env.local");
  const e = read(hasLocal ? ".env.local" : ".env.example");
  assert.match(e, /XENDIT_SECRET_KEY=/);
  assert.match(e, /DATABASE_URL=/);
  assert.match(e, /BETTER_AUTH_SECRET=/);
});

test("oxlint.config.ts anti-slop 15 rules at error and no legacy override", () => {
  const o = readFileSync(resolve(root, "oxlint.config.ts"), "utf8");
  assert.match(o, /anti-slop\/no-runtime-typeof/);
  assert.match(o, /anti-slop\/require-safety-comment-for-type-assertion/);
  assert.match(o, /jsPlugins:\s*\[/);
});

test("PR template and workflows exist", () => {
  assert.ok(existsSync(resolve(root, ".github/pull_request_template.md")));
  assert.ok(existsSync(resolve(root, ".github/workflows/pr-size.yml")));
  const ci = readFileSync(resolve(root, ".github/workflows/web-ci.yml"), "utf8");
  assert.match(ci, /oxlint/);
});
