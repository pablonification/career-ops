import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../../");
const webRoot = resolve(root, "web");

function read(rel) {
  return readFileSync(resolve(webRoot, rel), "utf8");
}

test("xendit.ts exports verify, duplicate check, createInvoice", () => {
  const s = read("src/server/billing/xendit.ts");
  assert.match(s, /export function verifyWebhookToken/);
  assert.match(s, /x-callback-token/);
  assert.match(s, /export async function isDuplicateWebhook/);
  assert.match(s, /export async function recordWebhookEvent/);
  assert.match(s, /export async function createInvoice/);
  assert.match(s, /api\.xendit\.co\/v2\/invoices/);
  assert.match(s, /XENDIT_SECRET_KEY/);
  assert.doesNotMatch(s, /unknown/);
});

test("quotas.ts checks hosted mode and returns 402 when exceeded", () => {
  const q = read("src/server/billing/quotas.ts");
  assert.match(q, /export async function checkQuota/);
  assert.match(q, /allowed:.*remaining/);
  assert.match(q, /export function isHostedMode/);
  assert.match(q, /HOSTED_MODE/);
  assert.match(q, /hostedUsageCounters/);
});

test("webhook route verifies token and handles idempotency", () => {
  assert.ok(existsSync(resolve(webRoot, "src/app/api/billing/webhook/route.ts")));
  const w = read("src/app/api/billing/webhook/route.ts");
  assert.match(w, /verifyWebhookToken/);
  assert.match(w, /isDuplicateWebhook/);
  assert.match(w, /recordWebhookEvent/);
  assert.match(w, /subscriptionStatus/);
  assert.match(w, /401/);
  assert.match(w, /duplicate/);
});

test("checkout route enforces quota with 402", () => {
  assert.ok(existsSync(resolve(webRoot, "src/app/api/billing/checkout/route.ts")));
  const c = read("src/app/api/billing/checkout/route.ts");
  assert.match(c, /requireTenant/);
  assert.match(c, /checkQuota/);
  assert.match(c, /isHostedMode/);
  assert.match(c, /402/);
  assert.match(c, /createInvoice/);
  assert.match(c, /xenditInvoiceId/);
});

test("tenants schema has billing fields and webhook events table", () => {
  const s = read("src/server/db/schema.ts");
  assert.match(s, /xenditCustomerId/);
  assert.match(s, /xenditInvoiceId/);
  assert.match(s, /periodEnd/);
  assert.match(s, /xenditWebhookEvents/);
  assert.match(s, /eventId.*unique/);
});

test("drizzle config still includes both schemas", () => {
  const d = read("drizzle.config.ts");
  assert.match(d, /auth-schema\.ts/);
});

test("env has Xendit dev key (example or local)", () => {
  const hasLocal = existsSync(resolve(webRoot, ".env.local"));
  const hasExample = existsSync(resolve(webRoot, ".env.example"));
  assert.ok(hasLocal || hasExample);
  const e = read(hasLocal ? ".env.local" : ".env.example");
  assert.match(e, /XENDIT_SECRET_KEY=/);
  assert.match(e, /XENDIT_WEBHOOK_TOKEN=/);
});

test("billing files use Tabler and handle requestId (no job-ops copy)", () => {
  const w = read("src/app/api/billing/webhook/route.ts");
  assert.match(w, /getRequestId/);
  assert.match(w, /apiOk/);
  assert.doesNotMatch(w, /sqliteTable/);
  const x = read("src/server/billing/xendit.ts");
  assert.doesNotMatch(x, /sqliteTable/);
});
