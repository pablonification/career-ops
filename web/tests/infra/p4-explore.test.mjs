import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../../");
const webRoot = resolve(root, "web");

function read(rel) {
  return readFileSync(resolve(webRoot, rel), "utf8");
}

test("scorer implements Block A-G with score 0-100 and legitimacy", () => {
  assert.ok(existsSync(resolve(webRoot, "src/server/scoring/scorer.ts")));
  const s = read("src/server/scoring/scorer.ts");
  assert.match(s, /export function scoreJob/);
  assert.match(s, /score:\s*number/);
  assert.match(s, /legitimacy:\s*"High"/);
  assert.match(s, /legitimacyTier/);
  assert.match(s, /100/);
  assert.doesNotMatch(s, /sqliteTable/);
});

test("explore API is tenant-scoped and scored", () => {
  assert.ok(existsSync(resolve(webRoot, "src/app/api/explore/scored/route.ts")));
  const r = read("src/app/api/explore/scored/route.ts");
  assert.match(r, /requireTenant/);
  assert.match(r, /getRequestId/);
  assert.match(r, /pipelineItems/);
  assert.match(r, /scoreJob/);
  assert.match(r, /legitimacyTier/);
  assert.match(r, /apiOk/);
});

test("explore page renders ScoredTable and uses Tabler", () => {
  const p = read("src/app/explore/page.tsx");
  assert.match(p, /ScoredTable/);
  assert.match(p, /from ".*scored-table"/);
});

test("score-badge and scored-table use Tabler and shadcn", () => {
  const b = read("src/components/explore/score-badge.tsx");
  assert.match(b, /@tabler\/icons-react/);
  assert.match(b, /IconStar|IconShieldCheck/);
  assert.match(b, /Badge/);
  assert.match(b, /\/100/);
  const t = read("src/components/explore/scored-table.tsx");
  assert.match(t, /ScoreBadge/);
  assert.match(t, /fetch\("\/api\/explore\/scored"\)/);
});

test("job-detail tabs cover Blocks A-G with Tabler", () => {
  assert.ok(existsSync(resolve(webRoot, "src/components/jobs/job-detail-tabs.tsx")));
  const j = read("src/components/jobs/job-detail-tabs.tsx");
  assert.match(j, /Overview/);
  assert.match(j, /Match/);
  assert.match(j, /Comp/);
  assert.match(j, /Custom/);
  assert.match(j, /Interview/);
  assert.match(j, /Legitimacy/);
  assert.match(j, /@tabler\/icons-react/);
  assert.match(j, /IconFileText/);
  const page = read("src/app/jobs/[id]/page.tsx");
  assert.match(page, /JobDetailTabs/);
});

test("billing files still present (no regression)", () => {
  assert.ok(existsSync(resolve(webRoot, "src/server/billing/xendit.ts")));
  assert.ok(existsSync(resolve(webRoot, "src/app/api/billing/webhook/route.ts")));
});
