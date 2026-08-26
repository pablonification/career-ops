# SaaS Roadmap — career-ops Web (TS-Only, Cloud-Ready)

> **Anchor for `/goal`.** This file is the single source of truth. The `/goal` objective
> references it, the agent re-reads it every auto-continue, compaction keeps it.
> Keep it short enough to survive context window (~160 lines). Update here, not in chat.

## 0. Objective

Turn CLI `career-ops` (MIT) into sellable web SaaS, inspired by `job-ops` patterns but
**no verbatim copy** of `job-ops` (AGPLv3 + Commons Clause `job-ops/LICENSE:195`).
Outcome: 6 PRs merged sequentially, each TDD, oxlint-clean, CI green, UI with screenshots.

`/goal` verification: `vitest run` + `tsc --noEmit` + `npx oxlint web/src` + `next build` when UI changes.

## 1. Locked Stack

- **Framework:** Next.js 16 App Router in `web/` `web/package.json:23` — single deploy, TS-only, no Go.
- **UI:** shadcn/ui + Tailwind 4 + `@tabler/icons-react` (replace `lucide-react:21` + `@iconify/react` everywhere). Enforce via `web-design-guidelines` skill.
- **DB:** Local Postgres `postgres:16-alpine` via `docker-compose.yml` (volume `pgdata`, healthcheck `pg_isready`). Drizzle ORM `pgTable` — **rewrite** of `job-ops/orchestrator/src/server/db/schema.ts:32` (tenants, users, memberships, jobs, hosted_usage_*), no copy.
- **Auth:** `better-auth` with `drizzleAdapter` + `organization` plugin → maps to `tenants:54` + `tenantMemberships:62`. Every query `where tenantId = session.activeOrganizationId` `job-ops/AGENTS.md:32`.
- **Billing:** Xendit ID — `Invoice` + `Recurring` + `Webhook` (`X-CALLBACK-TOKEN` verify, idempotency). Store `xenditCustomerId, subscriptionStatus, periodEnd` on tenants. Reuse `hosted_usage_counters:93` quota pattern (402 when exhausted, local unlimited unless enabled).
- **Pipeline/Billing/PDF:** TS `src/server/pipeline/orchestrator.ts` + SSE `infra/sse.ts` + Playwright/Typst worker. Keep scoring `modes/oferta.md` Blocks A-G verbatim.

## 2. Guardrails (Non-Negotiable)

- **License:** Sell MIT fork only. Learn patterns, write own code. Never commit AGPL file.
- **Multi-tenancy:** No module cache holds tenant data without tenant key. Scope DB, cache, queue, rate-limit, PDF path by tenant.
- **Anti-slop:** `oxlint.config.ts` 15 rules at `error` (`no-runtime-typeof`, `no-unknown-*`, etc). Legacy `*.mjs` CLI code has violations — ignore it, enforce only on `web/src` + new `src/server`. Honor `install-anti-slop` skill on every TS change.
- **TDD:** Red → Green → Refactor. Test first for every slice. No PR without failing test then passing test.
- **Commits/PRs:** Conventional `feat|fix|chore|test|docs(scope):` plain language. One concern per PR, size M max (30-99 lines effective, `pr-size.yml`). UI PR needs before/after screenshots/video. Small focused PRs `t3code/AGENTS.md:PRs`.

## 3. Product Flow

Merge `job-ops/README.md:59` + `career-ops/ARCHITECTURE.md:75`:

`Onboarding (CV -> Profile -> Portals) -> Explore (Scan) -> Score (Blocks A-G) -> Tailor -> Export PDF -> Track (Gmail) -> Today/Analytics`

Pages: `Today` `Explore` `Inbox/Pipeline (kanban: discovered|ready|applied|in_progress|skipped)` `JobDetail (tabs A-G)` `Tracker + Gmail` `CV/Settings/Analytics` — Tabler icons, shadcn shell `web/src/app/layout.tsx:28`.

## 4. Phases (Each = 1 PR, 2-5 Commits, TDD)

### P1 — infra: Baseline (PR #1)

- `docker-compose.yml`: postgres + app, `DATABASE_URL=postgres://app:app@postgres:5432/careerops`
- `web/drizzle.config.ts`, `web/src/server/db/{schema.ts,client.ts}` pgTable, migrate
- `better-auth` config `web/src/server/auth/auth.ts` + org plugin
- Swap `lucide-react` → `@tabler/icons-react` in `web/`, keep `vercel-react-best-practices`
- `.github/{pull_request_template.md, workflows/ci.yml, workflows/pr-size.yml}`, `oxlint.config.ts`
- Tests: `db:migrate` runs, `organization.create` + `member.add`, Tabler renders, `npx oxlint web/src` 0 errors
- Done: `docker compose up` healthy, `npm --workspace web run typecheck` pass

### P2 — auth: Workspaces & Tenancy

- Sign-in, org switch, invite, `session.activeOrganizationId` scoping
- Middleware guards tenant on all `/api/*` `{ok, data/error, meta.requestId}` `job-ops/AGENTS.md:7`
- Tests: cross-tenant isolation — tenant A cannot read B jobs (expect 403), session required (401)
- Done: isolation test green

### P3 — billing: Xendit + Quotas

- `web/src/server/billing/xendit.ts`: createCustomer, createInvoice, recurring, webhook verify + idempotency
- Tenant fields: `xenditCustomerId, subscriptionStatus, periodEnd, plan (byok|managed)`
- Reuse `hosted_usage_counters/reservations` quotas — block with `402 Quota Exceeded` when exhausted
- Tests: webhook replay idempotent, quota block, local mode bypasses quota
- Done: test webhook with `X-CALLBACK-TOKEN`, quota e2e pass. Missing `XENDIT_API_KEY` → pause goal, report blocker.

### P4 — explore: Scan + JobDetail Blocks

- `Explore` table: score 0-100, legitimacy tier G, filters, SSE pipeline run
- `JobDetail` 2-pane + tabs `Overview | Match B | Comp D | Custom E | Interview F | Legitimacy G`
- Port `scan.mjs` providers to queue jobs (TS), reuse `modes/oferta.md` scoring
- Tests: pipeline `discovered->ready`, Block B mapping to `cv.md` lines
- Done: screenshots, `vitest` pipeline tests pass

### P5 — tracker: Kanban + Gmail Watch

- Kanban statuses `jobs.status:219` (`discovered|processing|ready|applied|in_progress|skipped|expired`)
- `stage_events:280`, drag update, Gmail `postApplicationIntegrations:808` sync + relevanceDecision
- Tests: stage transition ledger, Gmail invite → `in_progress`
- Done: Gmail flow e2e with fixture

### P6 — cv: Tailor + PDF

- Tailor drawer → `tailoredSummary` → `<<cv-html>>` envelope → PDF (`pdfPath, pdfFingerprint`)
- Typst/Tectonic local render or Playwright, `tracer_links` optional
- Tests: fingerprint dedup, PDF generated
- Done: PDF download + preview

## 5. Process (Per PR, for `/goal` loop)

1. Write failing test (vitest) for slice.
2. Implement minimal TS to green.
3. `npx oxlint web/src` — fix anti-slop, no casts. `npm --workspace web run typecheck`.
4. Commit conventional: `feat(web): ...` / `fix(auth): ...` / `chore(infra): ...`
5. Group 2-5 commits → push branch `feat/p1-infra` → open PR (fill template, screenshots).
6. Self-review: `vercel-react-best-practices` + `web-design-guidelines` + anti-slop. Fix findings, push.
7. CI: `biome ci .` / `check:types` / `vitest run` / `next build` green → squash-merge → next phase.

Never make PR unless phase Done criteria pass. Keep PRs small, one concern. Quote `blocker` if env secret missing.

## 6. Verification (Every PR)

- `npx oxlint web/src` — 0 errors on new code
- `npm --workspace web run typecheck` — 0 errors
- `npm --workspace web run test:run` — green
- `npm --workspace web run build` — when UI changed
- Manual: screenshot/video for UI PR

## 7. Non-Goals

- No Go rewrite — TS only for SaaS.
- No mass auto-apply — human clicks Apply `ARCHITECTURE.md:5`.
- No copying `job-ops` files — inspiration only.
- No hosted Postgres — local volume. No `files are canonical` — DB is canonical for SaaS (migration one-way import).

## 8. Risks & Pause Conditions

- `XENDIT_API_KEY` / `BETTER_AUTH_SECRET` missing → `update_goal status:unmet blocker`.
- `oxlint` legacy `*.mjs` noise — scope to `web/src`, don't weaken rules.
- Env `DATABASE_URL` must point to local PG — don't use Neon in dev.
