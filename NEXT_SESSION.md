# VocabMaxx — Session Handoff

**Read this first. This is the complete context for the next session.**

---

## State as of 2026-06-10 (post final-review remediation)

### What's done

| Phase | Status | Notes |
|---|---|---|
| Docs (PRD, ARCHITECTURE, TECH_SPEC, ROADMAP, ADRs 0001–0007, SECURITY, RUNBOOK, CONTRIBUTING) | ✅ | reconciled to code in this pass |
| Phase 0 — Scaffold + auth + RLS + CI | ✅ | |
| Phase 1 — Domain (SM-2 + Word invariants) | ✅ | `ValidWord` brand now enforced on the save path |
| Phase 2 — Persistence (queries + services + RLS) | ✅ | |
| Phase 3 — Definition pipeline (dict + DeepSeek + cache + `/api/capture`) | ✅ | capture route now rate-limited |
| Phase 4 — Capture UI + dashboard + app shell + import | ✅ | dashboard stats are now **real** (streak/retention/week/sparkline) |
| Phase 5 — Review session (`/review`, `/api/review/due`, `/api/review/grade`) | ✅ | grade now enforces the due-date (`not_due` → 409) |
| Phase 6 — Word list / detail / search / edit / delete | ✅ | |
| Phase 7 — Insights (growth / retention / problem words) | ✅ | |
| Phase 8 — Settings, account deletion, JSON/CSV export, daily digest cron | ✅ | real `SettingsForm` + `DeleteAccountDialog`; `GET /api/export?format=json\|csv` (Anki → 501); `DELETE /api/account`; `GET`/`PATCH /api/preferences`; `GET`/`POST /api/cron/daily-digest` (Vercel Cron `0 14 * * *`) |
| **Beyond core:** `/algorithm` SM-2 lab, practice mode | ✅ | |

**168 unit tests green.** `pnpm lint`, `pnpm typecheck` clean on a fresh checkout. Integration tests (`pnpm test:integ`) require a live Supabase test project and were **not** re-run in the remediation worktree — run them before merging.

### What's NOT done yet

- **Phase 9** — Polish & launch (Lighthouse ≥ 95, SEO, OG, perf pass).
- **Anki `.apkg` export** — `GET /api/export?format=anki` currently returns 501 (not yet implemented); planned for Phase 9 or a dedicated pass.
- Sentry — removed in Phase 0 cleanup; not planned for MVP. All references purged from docs/config.
- Distributed rate limiting — current limiter is best-effort in-memory (per serverless instance); see `docs/SECURITY.md` §6. Upgrade to Upstash/Redis before heavy traffic.

> **⚠️ DATABASE_URL pooler host:** prod uses `aws-1-ap-southeast-1.pooler.supabase.com:6543` (transaction pooler). The aws-0 host returns `tenant/user not found`. Keep Vercel's `DATABASE_URL` on the aws-1 host.

---

## How to run locally

```bash
pnpm install
pnpm dev                       # http://localhost:3000
pnpm test:unit                 # ~1.5s, 131 tests
pnpm test:integ                # hits the Supabase test project
pnpm verify                    # lint + typecheck + unit + integration
```

`pnpm db:push` is unsupported over typical IPv6-restricted networks. Apply schema via the Supabase SQL Editor: `drizzle/0000_next_wallow.sql`, then `0001_rls.sql`, then `0002_views.sql` (optional analytics views), then `0003_user_preferences.sql` (Phase 8 preferences table + RLS).

---

## DB connection topology

| Var | Project | Pooler | Port | Used by |
|---|---|---|---|---|
| `DATABASE_URL` | prod | Transaction | 6543 | App runtime on Vercel |
| `SUPABASE_TEST_DB_URL` | test | Session | 5432 | `pnpm test:integ` |

---

## Next phase

**Phase 9 — Polish & launch** (`docs/ROADMAP.md` Phase 9):
- Lighthouse ≥ 95 on `/`, `/dashboard`, `/review`.
- SEO meta tags + OG image.
- Performance pass (bundle trim, preload hints).
- Anki `.apkg` export (currently returns 501 at `GET /api/export?format=anki`).
