# VocabMaxx — Final Review & Remediation

**Audit date:** 2026-06-10 · **Branch:** `chore/final-review-wt`
**Scope of remediation:** Every issue below is taken up as a task and fixed. **Phase 9 (Lighthouse / SEO / OG / launch polish) is explicitly out of scope** per instruction. Phase 8 features (export, daily digest) are **not built** — instead all docs are corrected to stop advertising them as shipped (YAGNI; no dead surface).

**Goal:** zero security vulnerabilities and zero correctness/consistency issues across code, flow, and docs.

---

## Verdict

| Before | After remediation |
|---|---|
| 🟡 Partial pass — strong core, pervasive doc drift, several account-bounded code gaps | 🟢 Pass — real bugs fixed, security hardened, docs reconciled to reality |

**Ground truth verified during audit:** 117 unit tests pass, `next build` succeeds, CI (lint + typecheck + unit) green on a fresh checkout. The earlier "typecheck fails" reading was a **stale gitignored `.next/types` cache**, not a code defect. `.env.local` is gitignored and untracked (no secret leak).

---

## Task checklist

### A. Security & correctness (code)

- [x] **A1 (High)** Enforce SRS due-date in `recordReview`; return `not_due` → 409. `lib/services/srs.service.ts`, `app/api/review/grade/route.ts`, test.
- [x] **A2 (Med)** Make duplicate capture race-safe: `onConflictDoNothing` + 409 instead of 500. `lib/db/queries/words.ts`, `lib/services/word.service.ts`, test.
- [x] **A3 (Med)** Rate-limit `POST /api/capture` (was unthrottled). `app/api/capture/route.ts`.
- [x] **A4 (Med)** Rate limiter is per-instance on serverless — pluggable store + honest disclosure; keep best-effort in-memory default. `lib/utils/rate-limit.ts`, `docs/SECURITY.md`.
- [x] **A5 (Med)** Remove dead **unscoped** DB/service helpers (IDOR risk): `words.deleteById`, `wordService.getById`, `words.findById`.
- [x] **A6 (Med)** Enforce the `ValidWord` invariant on the real save path (call `createWord`). `lib/services/word.service.ts`.
- [x] **A7 (Low)** Add missing app paths to middleware `isProtected`; preserve query string on redirect. `lib/auth/middleware.ts`.
- [x] **A8 (Low)** Unify the term regex (schema vs service) + fix the capture UI hint.
- [x] **A9 (Low)** Align `retentionRate` window with `vocabGrowth` (off-by-one). `lib/services/analytics.service.ts`.
- [x] **A10 (Low)** Delete duplicate dead utils: `lib/utils/result.ts`, `lib/utils/cn.ts`.
- [x] **A11 (Low)** `toUserMessage(kind: string)` — **reclassified as by-design** after verification: the client passes kinds deserialized from API JSON (`string` at runtime) and the fallback is the intended forward-compat guard, not a masked typo. Documented the intent in `lib/utils/errors.ts` rather than introducing a breaking union type.
- [x] **A12 (Low)** Fix lint warning (`any` in `tests/unit/middleware.test.ts`).
- [x] **A13 (Sec)** Add `gitleaks` secret-scan CI job (makes the documented control real). `.github/workflows/ci.yml`.

### B. User-facing data integrity (UX)

- [x] **B1 (High)** Replace hardcoded dashboard zeros with real streak / retention / week / sparkline + real recent-word status.
- [x] **B2 (Med)** Remove the permanently-disabled Topbar "search" stub.
- [x] **B3 (Med)** Stop landing copy promising export that doesn't exist.

### C. Documentation reconciliation

- [x] **C1 (Crit)** README: phase table → 0–7 done / 8–9 planned; test counts → 117; export/digest marked planned.
- [x] **C2 (Crit)** Add `LICENSE` (MIT) — fixes broken badge link.
- [x] **C3 (Crit)** `.env.example`: `aws-1` host; remove Sentry vars.
- [x] **C4 (Crit)** Purge all Sentry references (README, SECURITY, RUNBOOK, TECH_SPEC, ROADMAP, ARCHITECTURE, `.gitignore`).
- [x] **C5 (Crit)** Rewrite `NEXT_SESSION.md` handoff.
- [x] **C6 (High)** OpenAPI / TECH_SPEC / ARCHITECTURE: remove 5 phantom endpoints.
- [x] **C7 (High)** `SECURITY.md` §6: describe the real token-bucket rate limiter.
- [x] **C8 (High)** Remove false CI claims (`db:migrate`, integration-in-CI, "90 tests"); reconcile gitleaks claim with A13.
- [x] **C9 (Med)** ARCHITECTURE repo layout: remove phantom files, add real ones.
- [x] **C10 (Med)** Fix stack facts: Base UI (not Radix); ADR 0001 Next.js 16.
- [x] **C11 (Med)** CONTRIBUTING: remove phantom scripts; add real `test:watch`; reconcile clone URL.
- [x] **C12 (Med)** Single repo name everywhere: `vocabmaxx`.
- [x] **C13 (Low)** Document `/algorithm` lab + practice mode as shipped enhancements.

---

## Remediation log

**All tasks complete.** Worktree branch `chore/final-review-wt`.

### Verification (ground truth, run after the changes)

| Gate | Result |
|---|---|
| `vitest run tests/unit` | **131 passed** (was 117; +14 new tests: SRS not_due, save race/validation, dashboard stats) |
| `vitest --config vitest.integration.config.ts` | **58 passed** (against the live Supabase test project) |
| `tsc --noEmit` | **exit 0** |
| `eslint .` | **exit 0** (the 1 prior `any` warning fixed) |
| `next build` | **exit 0** |

**Total: 189 tests green.**

### Security posture after remediation

- Review grading now rejects out-of-schedule grades (`not_due` → 409) — no self-inflicted schedule corruption; proven by a new unit test and the rewritten concurrent-grade integration test (one grade wins, the other is `not_due`, exactly one log row).
- Duplicate capture is race-safe (`insertIfAbsent` + `onConflictDoNothing`) → clean 409, never a 500; covered by unit + integration tests.
- `POST /api/capture` is now rate-limited (was unthrottled).
- Rate limiter's per-instance limitation is documented honestly (SECURITY §6) with the Upstash/Redis upgrade path noted.
- Dead **unscoped** IDOR-risk helpers removed (`words.deleteById`, `words.findById`, `wordService.getById`).
- `ValidWord` invariant is now enforced on the capture save path (was decorative/dead).
- Middleware defense-in-depth now covers the whole `(app)` group and preserves the `next` query string.
- `gitleaks` secret-scan added to CI; `.env.local` confirmed gitignored/untracked.

### Notable decisions

- **Phase 8 not built** (export, daily digest) — out of audit scope; every doc that advertised them as shipped was corrected to mark them **planned (Phase 8)**. This resolves the over-claim without adding dead surface (YAGNI).
- **Phantom API endpoints** removed from OpenAPI / TECH_SPEC / ARCHITECTURE rather than implemented (nothing consumes them).
- **Phase 9 deliberately skipped** per instruction (Lighthouse/SEO/OG/perf).
- **A11** reclassified as by-design (see above).
- Historical logs (`PHASE_0_AUDIT.md`, `PHASE_4_BUGS.md`, `webusage.md`) left as point-in-time records; only living docs were reconciled.

### Files changed

- **Code (security/correctness):** `lib/services/srs.service.ts`, `app/api/review/grade/route.ts`, `lib/db/queries/words.ts`, `lib/services/word.service.ts`, `lib/domain/word.ts`, `app/api/capture/route.ts`, `lib/auth/middleware.ts`, `lib/validation/capture.schema.ts`, `lib/services/definition.service.ts`, `lib/services/analytics.service.ts`, `lib/utils/errors.ts`, `lib/utils/rate-limit.ts`; deleted `lib/utils/result.ts`, `lib/utils/cn.ts`.
- **Code (UX/dashboard):** `lib/services/dashboard.service.ts`, `lib/db/queries/analytics.ts`, new `lib/insights/dashboard.ts`, `components/layout/Topbar.tsx`, `components/capture/AddWordInput.tsx`, `app/(marketing)/page.tsx`.
- **Tests:** updated `tests/unit/{srs.service,word.service,dashboard.service,middleware}.test.ts`, `tests/integration/db/{words,srs,grade-race}.test.ts`; new `tests/unit/dashboard-stats.test.ts`.
- **CI/config:** `.github/workflows/ci.yml` (gitleaks job), `.env.example`, `.gitignore`, new `LICENSE`.
- **Docs:** `README.md`, `NEXT_SESSION.md`, `docs/{SECURITY,RUNBOOK,TECH_SPEC,ARCHITECTURE,ROADMAP,CONTRIBUTING,PRD}.md`, `docs/api/openapi.yaml`, `docs/ADR/0001-nextjs-app-router.md`.
