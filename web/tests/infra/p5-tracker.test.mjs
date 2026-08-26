import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../../");
const webRoot = resolve(root, "web");

function read(rel) {
  return readFileSync(resolve(webRoot, rel), "utf8");
}

test("gmail watch classifies and matches", () => {
  assert.ok(existsSync(resolve(webRoot, "src/server/gmail/watch.ts")));
  const w = read("src/server/gmail/watch.ts");
  assert.match(w, /export function classifyGmailSubject/);
  assert.match(w, /interview/);
  assert.match(w, /rejection/);
  assert.match(w, /export function matchGmailToApplication/);
  assert.match(w, /fromDomain/);
});

test("tracker API is tenant-scoped with Kanban move and ledger", () => {
  assert.ok(existsSync(resolve(webRoot, "src/app/api/tracker/route.ts")));
  const r = read("src/app/api/tracker/route.ts");
  assert.match(r, /requireTenant/);
  assert.match(r, /getRequestId/);
  assert.match(r, /applications/);
  assert.match(r, /statusLedger/);
  assert.match(r, /byStatus/);
  assert.match(r, /POST/);
  assert.match(r, /kanban/);
});

test("gmail webhook verifies and updates status", () => {
  assert.ok(existsSync(resolve(webRoot, "src/app/api/gmail/webhook/route.ts")));
  const g = read("src/app/api/gmail/webhook/route.ts");
  assert.match(g, /x-gmail-secret/);
  assert.match(g, /classifyGmailSubject/);
  assert.match(g, /matchGmailToApplication/);
  assert.match(g, /Interview/);
  assert.match(g, /Rejected/);
  assert.match(g, /statusLedger/);
});

test("kanban uses Tabler and Badge and tracker page exists", () => {
  assert.ok(existsSync(resolve(webRoot, "src/components/tracker/kanban.tsx")));
  const k = read("src/components/tracker/kanban.tsx");
  assert.match(k, /@tabler\/icons-react/);
  assert.match(k, /IconGripVertical|IconLoader2/);
  assert.match(k, /Badge/);
  assert.match(k, /byStatus/);
  assert.match(k, /\/api\/tracker/);
  const p = read("src/app/tracker/page.tsx");
  assert.match(p, /Kanban/);
  assert.match(p, /IconLayoutKanban/);
  assert.match(p, /Gmail Watch/);
});

test("billing still present (no regression)", () => {
  assert.ok(existsSync(resolve(webRoot, "src/app/api/billing/webhook/route.ts")));
});
