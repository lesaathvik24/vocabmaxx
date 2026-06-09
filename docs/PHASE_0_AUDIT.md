# Phase 0 Audit — VocabMaxx

**Date:** 2026-06-09
**Verdict:** ❌ **NOT DONE — BLOCK**
**One-line reason:** `pnpm build` and `pnpm dev` both return HTTP 500 on every CSS-importing route (Tailwind v4 / Next 16 / Turbopack PostCSS plugin mismatch). Additionally, the canonical Drizzle migration ships **without RLS**, so a fresh `drizzle migrate` leaves the DB wide-open cross-tenant.

## Resolution status (2026-06-09 follow-up)

The audit blockers below have been addressed across 5 parallel tracks + a tightening pass:

| # | Original blocker | Status | Notes |
|---|---|---|---|
| 1 | Build broken (Tailwind v4/PostCSS) | ✅ Fixed | postcss.config → CJS; build passes |
| 2 | Canonical migration lacks RLS | ✅ Fixed | drizzle/0001_rls.sql tracked |
| 3 | definition_cache RLS dormant | ✅ Fixed | Enabled in 0001_rls.sql |
| 4 | Sign-up uses Math.random password | ✅ Fixed | signInWithOtp |
| 5 | Open-redirect on callback next | ✅ Fixed | URL-parsed validator + unit tests |
| 6 | test:integ exits 1 on empty | ✅ Fixed | --passWithNoTests |
| 7 | Missing schema + middleware tests | ✅ Fixed | Both added |
| 8 | Sentry not wrapped with withSentryConfig | ⏸ Deferred | Tracked separately |
| 9 | DB IPv6 blocks db:push | ⏸ Manual | User applies via SQL editor |
| 10 | No app/(app)/layout.tsx | ✅ Fixed | requireUser() defense-in-depth |

**Deferred (documented, accepted):**
- CSP `'unsafe-inline'` for scripts — Next 16 + Sentry need it; revisit with nonce-based CSP later
- `middleware.ts` → `proxy.ts` rename — Next 16 deprecation warning, not removed; defer to Next 17
- `tests/e2e/auth.spec.ts` (Playwright) — defer to Phase 2 (requires live Supabase)
- Sentry wrap of `next.config.ts` with `withSentryConfig` — separate task

**Remaining MANUAL steps (user-only):**
1. Apply `drizzle/0001_rls.sql` in Supabase SQL editor; verify all 5 tables have `rowsecurity = true`
2. Configure Supabase Google OAuth + redirect URLs
3. Live test: Google sign-in + magic-link sign-up end-to-end
4. Deploy to Vercel + smoke-test prod
5. Throw test error → confirm Sentry receives
6. Flip Phase 0 checkboxes in docs/ROADMAP.md

This document consolidates findings from three parallel audits:
- **Crucible** (test coverage)
- **Critic** (security / correctness)
- **General-purpose agent** (prod-readiness / user flow / modularity / checklist verification)

---

## TL;DR — what blocks Phase 0 sign-off

| # | Blocker | Severity | Owner |
|---|---|---|---|
| 1 | `pnpm build` + `pnpm dev` 500 on every page (Tailwind v4/PostCSS plugin) | 🔴 Critical | Fix first |
| 2 | Canonical migration `drizzle/0000_next_wallow.sql` has **no RLS** — fresh deploys are open cross-tenant | 🔴 Critical | Fix before any data |
| 3 | `definition_cache` table: RLS **not enabled** → anon can INSERT/UPDATE/DELETE (cache poisoning) | 🔴 Critical | Fix with #2 |
| 4 | Sign-up uses `Math.random().toString(36)` as a real password instead of magic-link | 🔴 Critical | `signInWithOtp` swap |
| 5 | OAuth callback `next` param unvalidated → open-redirect class | 🟠 High | Validate prefix |
| 6 | `pnpm test:integ` exits 1 on empty dir (would break CI the moment it's wired) | 🟠 High | `--passWithNoTests` |
| 7 | Two roadmap-required tests missing: `tests/integration/db/schema.test.ts`, `tests/e2e/auth.spec.ts` | 🟠 High | Write |
| 8 | `next.config.ts` not wrapped with `withSentryConfig` → 0.7a unmet | 🟠 High | Wrap |
| 9 | DB schema unapplied on remote (IPv6 blocks `db:push`); workflow is manual SQL paste | 🟠 High | Migration story |
| 10 | `app/(app)/layout.tsx` does NOT exist → no server-component defense-in-depth | 🟡 Medium | Add layout w/ `requireUser()` |

---

## 1. Build & runtime (general-purpose agent)

```
pnpm build → FAILS
  TypeError: plugin is not a function (app/globals.css, PostCSS)

pnpm dev → starts, but:
  GET /               → 500
  GET /auth/sign-in   → 500
  GET /auth/sign-up   → 500
  GET /dashboard      → 307 → /auth/sign-in?next=/dashboard
    (only "works" because middleware short-circuits before render)
```

**Root cause hypothesis:** Next 16 + Turbopack + Tailwind v4 `@tailwindcss/postcss` plugin shape mismatch. Either pin compatible versions, switch the `globals.css` to the v4 `@import "tailwindcss"` syntax with the right plugin export, or move off Turbopack for the build until v4 stabilizes.

**Other Next 16 warnings to address while fixing:**
- `experimental.typedRoutes` is now `typedRoutes` (top-level).
- `middleware.ts` convention is **deprecated** in Next 16 — rename to `proxy.ts`.
- Workspace root collision: `/Users/lekhansaathvik/package-lock.json` confuses Next vs project `pnpm-workspace.yaml`.

---

## 2. Security & correctness (Critic — verdict: **BLOCK**)

### 🔴 Critical

**RLS missing from canonical migration**
- `drizzle/0000_next_wallow.sql:1-63` creates all app tables but does **not** `ENABLE ROW LEVEL SECURITY` and creates **zero** policies. `apply_schema.sql` (hand-applied) is the only thing with RLS, and it is not the source of truth.
- **Fix:** generate a tracked `drizzle/0001_rls.sql`, delete `apply_schema.sql`, verify with `select tablename, rowsecurity from pg_tables where schemaname='public'`.

**`definition_cache` RLS dormant**
- `apply_schema.sql:78-79` has only a `public_read` SELECT policy, and RLS is **not enabled** on the table (it's missing from the `ALTER ... ENABLE ROW LEVEL SECURITY` list).
- **Fix:** `ALTER TABLE definition_cache ENABLE ROW LEVEL SECURITY;` — once on, absence of write policies denies anon writes; only service role bypasses.

**Sign-up creates accounts with a non-cryptographic random password**
- `app/auth/sign-up/page.tsx:21` — `password: Math.random().toString(36)` permanently associates a guessable ~11-char base36 secret with the account.
- **Fix:** use `supabase.auth.signInWithOtp` for sign-up (Supabase auto-creates the user), and disable password auth in Supabase.

### 🟠 High

- **Open-redirect surface in `app/auth/callback/route.ts:8`** — `next` query param round-tripped without prefix validation. `next='//evil.com/x'` or `next='/\\evil.com'` can escape origin in some browsers. Fix: validate `next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')`.
- **Middleware auth gating is a hard-coded prefix allowlist** (`middleware.ts:8-11`, `lib/auth/middleware.ts:28-31`). Route group `(app)` does not contribute to URLs, so a future `/settings` placed under `(app)/` is silently unauthenticated. **No `app/(app)/layout.tsx` exists** for server-component defense-in-depth. Fix: add the layout with `await requireUser()`, and/or invert middleware to an explicit public allowlist.
- **No PKCE/state correlation check** beyond what `@supabase/ssr` does internally — unverified. Confirm before merge.
- **`lib/db/client.ts:9`** — `postgres()` evaluated at module import with no `import 'server-only'` guard → can leak into client bundles.
- **`drizzle.config.ts:8`** — hardcoded Supabase project ref as fallback (info leak in public repo); throw if `DATABASE_URL` missing instead.
- **`.github/workflows/ci.yml`** — currently safe (no secrets), but document "never add secrets here; use a separate non-`pull_request_target` deploy workflow" before adding deploy steps.

### 🟡 Medium

- `next.config.ts:18` — CSP `'unsafe-inline'` for scripts; switch to nonce-based CSP.
- `next.config.ts:22` — `connect-src` missing `https://us-assets.i.posthog.com`.
- `sentry.*.ts` — identical files, no `beforeSend` PII scrubber, no environment/release tagging. User emails will land in Sentry.
- `lib/analytics/posthog.tsx:13` — set `person_profiles: 'identified_only'` (cost + GDPR).
- `lib/auth/server.ts:28-32` — `getSession()` returns unverified JWT-only session; foot-gun. Rename to `getUnverifiedSession` or remove.

### What's good

- Middleware uses `getUser()` (verified), not `getSession()` — correct pattern.
- Cookie `setAll` matches Supabase SSR docs (no refresh race).
- Global security headers set (`X-Frame-Options`, `frame-ancestors 'none'`, `nosniff`, Referrer-Policy).

---

## 3. Test coverage (Crucible)

### Pass/fail

| Suite | Result |
|---|---|
| `pnpm test:unit` | ✅ 10/10 (`tests/unit/srs.test.ts` only) |
| `pnpm test:integ` | ❌ Exit 1 — no test files found |
| `pnpm test:e2e --list` | ❌ Exit 1 — 0 tests in 0 files |

`pnpm verify` skips integration entirely (`= lint && typecheck && test:unit`). The ROADMAP claim "CI runs lint + typecheck + unit + integration" is wrong vs the script.

### Roadmap-required tests that DO NOT EXIST

| Subtask | Required file | Status |
|---|---|---|
| 0.4b RLS policies | `tests/integration/db/schema.test.ts` | Missing |
| 0.5c Sign-up + OAuth callback | `tests/e2e/auth.spec.ts` | Missing |
| 0.3b Auth middleware | (no test required by roadmap, but should exist) | Missing |

### Quality issue

**`tests/unit/srs.test.ts` worked-example suite shares mutable `let state` across `it` blocks.** Tests are order-dependent — `vitest --testNamePattern="step 3"` alone fails. Replace with explicit per-step inputs threading output → input as a local const.

### Concrete missing tests to write

1. `tests/integration/db/schema.test.ts` — assert 5 tables exist, RLS on exactly 4 (`pg_class` / `pg_policies` introspection).
2. `tests/e2e/auth.spec.ts` — unauth'd `/dashboard` → redirect to `/auth/sign-in`; sign-in page has Google button + magic-link input.
3. Fix `srs.test.ts` worked-example for order-independence.
4. `tests/unit/middleware.test.ts` — mocked `NextRequest`, assert redirect to `/auth/sign-in` when no session.
5. Change `test:integ` script to `vitest run tests/integration --passWithNoTests` until real tests land.

---

## 4. User flow trace (static read)

Wiring is **correct in principle**:
- Sign-in: magic-link + Google OAuth both call `supabase.auth.*` with `${location.origin}/auth/callback`.
- Callback: `exchangeCodeForSession(code)` → redirect to `/dashboard`.
- Middleware: protects `/dashboard /review /words /insights`, redirects to `/auth/sign-in?next=...`.
- Sign-out: exists at `components/layout/sign-out-button.tsx`.

**But:**
- Sign-up uses password, not magic-link (Critical, above).
- Stray `console.log('[OAuth]'...)` in `app/auth/sign-up/page.tsx:39`.
- `SignOutButton` instantiates its own `createBrowserClient` instead of using `lib/auth/client.ts` (DRY miss).

---

## 5. Structure & modularity

- `lib/domain/` is pure (82 LOC, no React/Drizzle imports) — clean.
- `lib/auth/` cleanly split client/server/middleware.
- `lib/services/` does **not** exist (expected for Phase 2+).
- `lib/validation/` has 3 Zod schemas with no consumers yet — slightly premature but harmless.
- `components/` has only `layout/sign-out-button.tsx` — **no `components/ui/` shadcn primitives**, despite ROADMAP 0.2a acceptance criterion (`npx shadcn add button` writes `components/ui/button.tsx`).

---

## 6. Phase 0 checklist verdict (vs ROADMAP "End-to-end verification A-Z")

| Item | Verdict | Evidence |
|---|---|---|
| `pnpm install` clean | ✅ | Deps resolve |
| `pnpm dev` renders marketing | ❌ | `GET /` → 500 |
| `pnpm build` 0 warnings/errors | ❌ | Build aborts; multiple warnings |
| `pnpm lint && typecheck` | ⚠️ | Claimed green; not re-verified |
| `pnpm test:unit` | ✅ | 10/10 |
| `pnpm db:reset && db:push` → 5 tables, RLS on 4 | ❌ | IPv6 blocks `db:push`; manual SQL paste |
| `/dashboard` unauthed → `/auth/sign-in` | ✅ | 307 verified live |
| Google sign-in → `/dashboard` | ⚠️ | Wired, needs live OAuth to verify |
| Magic-link → `/dashboard` | ⚠️ | Sign-in OK; **sign-up broken (password path)** |
| Sign-out → redirect to sign-in | ✅ (static) | Code present |
| Test error → Sentry issue | ⚠️ | `next.config.ts` NOT wrapped with `withSentryConfig` |
| `/` PostHog pageview | ⚠️ | Provider mounted, but `/` 500s |
| Noop PR CI green in 5 min | ⚠️ | Workflow exists; not re-run |
| Vercel production live | ❌ | Not deployed |
| All ROADMAP checkboxes flipped | ❌ | All `[ ]` |

---

## 7. Docs drift (selected)

- `docs/ARCHITECTURE.md §2` lists `components/ui/*`, `components/marketing/*`, `capture`, `review`… → only `components/layout/sign-out-button.tsx` exists. Expected drift for Phase 0; note for Phase 5+.
- `docs/ARCHITECTURE.md §2` says `lib/analytics/posthog.ts` → file is `posthog.tsx`. Minor.
- `docs/ARCHITECTURE.md §2` references `app/api/auth/[...]/route.ts` → does not exist (callback is `app/auth/callback/route.ts`).
- `docs/ROADMAP.md` Phase 2/5 uses `srs_state.next_review_at`; schema and `TECH_SPEC §1` use `due_date`. Fix terminology drift in ROADMAP.

---

## 8. Phase 1 blockers (foundation gaps that will bite)

1. **Build is broken right now.** Cannot manually verify anything until Tailwind v4 / Turbopack PostCSS chain is fixed.
2. **No `lib/services/` scaffold.** Phase 2 lands cold without an agreed `Result<T,E>` seam exercised once.
3. **DB schema unapplied + `db:push` IPv6-blocked.** Manual SQL paste is fragile — need Supabase CLI / tunnel before Phase 2 integration tests.
4. **No test-DB setup.** `tests/integration/` and `tests/e2e/` are empty dirs. ROADMAP Phase 2 §1 calls for `npx supabase start` or `vocabmaxx-test` — neither configured.
5. **No `pnpm db:seed`** for Phase 4/5/6 manual verification.
6. **`lib/db/client.ts` throws at import time** — any module statically importing it will break the build when env vars are missing in CI. Make it lazy + `'server-only'`.
7. **Sign-up flow is functionally broken** (random-password account).
8. **Sentry not wired into `next.config.ts`** — release source-maps + tunneling won't work in prod.
9. **Next 16 `middleware` deprecation** — rename to `proxy.ts`.
10. **Husky / gitleaks pre-commit (ROADMAP 0.2d)** — `.husky/` not verified, hook unconfirmed.

---

## 9. Recommended fix order (next session)

1. **Unblock the build** — pin Tailwind v4 / `@tailwindcss/postcss` to a known-compatible Next 16 combo OR switch to `next dev` (no Turbopack) and document. Re-run `pnpm build` + `curl localhost:3000/` until 200.
2. **Generate RLS migration** — `drizzle/0001_rls.sql` with all policies + `definition_cache` RLS enable. Delete `apply_schema.sql`. Re-apply on remote.
3. **Fix sign-up flow** — swap to `signInWithOtp` and delete the random-password path.
4. **Add `app/(app)/layout.tsx`** that calls `await requireUser()`.
5. **Validate `next` param** in `app/auth/callback/route.ts` (prefix check).
6. **Wrap `next.config.ts` with `withSentryConfig`.**
7. **Wire missing tests** (schema, e2e auth, middleware unit) + fix `srs.test.ts` order-dependence + `test:integ --passWithNoTests`.
8. **Rename `middleware.ts` → `proxy.ts`** per Next 16.
9. **Make `lib/db/client.ts` lazy + `import 'server-only'`.**
10. **Sentry `beforeSend` PII scrub; PostHog `person_profiles: 'identified_only'`.**
11. **Fix ROADMAP `next_review_at` → `due_date` drift.**
12. **Re-run full Phase 0 verification checklist; flip checkboxes only when each box is genuinely green.**

---

## 10. Files referenced

- `app/globals.css`, `postcss.config.mjs`, `next.config.ts` — build break
- `drizzle/0000_next_wallow.sql`, `drizzle/apply_schema.sql`, `lib/db/schema.ts` — RLS gap
- `app/auth/sign-up/page.tsx`, `app/auth/sign-in/page.tsx`, `app/auth/callback/route.ts` — auth flow
- `middleware.ts`, `lib/auth/middleware.ts`, `lib/auth/server.ts`, `lib/auth/client.ts` — auth gating
- `lib/db/client.ts`, `drizzle.config.ts` — DB layer
- `sentry.client.config.ts`, `sentry.server.config.ts`, `lib/analytics/posthog.tsx` — observability
- `.github/workflows/ci.yml` — CI
- `tests/unit/srs.test.ts` — only existing test file
- `components/layout/sign-out-button.tsx` — only existing component

---

**Use this doc as the starting context for the next session. Fix in order above, re-run all three audits, then flip Phase 0 checkboxes in `docs/ROADMAP.md`.**
