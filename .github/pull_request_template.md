<!--
Keep PRs small and focused — one concern per PR, size M max (30-99 lines effective).
See docs/saas-roadmap.md for slicing.
-->

## What Changed
<!-- Describe the change clearly and keep scope tight. -->

## Why
<!-- Explain the problem being solved and why this approach is right. -->

## Verification
- [ ] `npx oxlint web/src` — 0 errors on new TS
- [ ] `npm --workspace web run typecheck` — pass
- [ ] `vitest run` — green
- [ ] `npm --workspace web run build` — when UI changed

## UI Changes
<!-- If UI, include before/after screenshots or video. Delete if not applicable. -->

## Checklist
- [ ] Conventional commit `feat|fix|chore|test|docs(scope):`
- [ ] TDD: test first then implement
- [ ] Anti-slop clean (no unknown casts, no runtime typeof at boundary)
- [ ] Tenant scope checked (tenantId on every query)
