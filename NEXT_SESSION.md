# VocabMaxx — Session Handoff

**Read this first. This is the complete context for the next session.**

---

## State as of 2026-06-10

### What's done

| Phase | Status | Tests |
|---|---|---|
| Docs (PRD, ARCHITECTURE, TECH_SPEC, ROADMAP, ADRs 0001–0007, etc.) | ✅ | — |
| Phase 0 — Scaffold + auth + RLS + CI | ✅ | — |
| Phase 1 — Domain layer (SM-2 + Word invariants) | ✅ | 36 unit |
| Phase 2 — Persistence (queries + services + RLS) | ✅ | 18 integ |
| Phase 3 — Definition pipeline (dict + DeepSeek + cache + `/api/capture`) | ✅ | 23 (7 unit + 16 integ) |
| Phase 4 — Capture UI + dashboard + app shell + import | ✅ | see git log |
| Phase 5 — Review session (`/review`, `/api/review/due`, `/api/review/grade`) | ✅ | 7 unit + 10 integ new |
| **Total green** | | **133 tests (80 unit + 53 integ)** |

> **⚠️ DATABASE_URL pooler host changed 2026-06-10:** prod tenant moved off `aws-0-ap-southeast-1.pooler.supabase.com` (was returning `tenant/user not found`). `.env.local` now uses `aws-1-ap-southeast-1.pooler.supabase.com:6543`. **Update `DATABASE_URL` on Vercel to the aws-1 host too**, or production will 500 on every DB call.

Gates on `master`: `pnpm lint` clean, `pnpm typecheck` clean, `pnpm verify` green.

### What's NOT done yet

- Phase 4+ (capture UI, dashboard, review, words list, insights, settings, polish).
- Vercel production deploy (no auto-deploy hook wired yet — see "Vercel" below).
- Sentry — removed in Phase 0 cleanup; deferred to post-launch as an improvement.

---

## Phase 1–3 surface (what shipped)

### Domain (`lib/domain/`)
- `grade.ts` — `Grade = { Again:0, Hard:3, Good:4, Easy:5 }`.
- `srs.ts` — `nextState(current, grade, now)` with fail-loud guards on NaN/negative/non-int/below-floor state. `InvalidSRSStateError`.
- `word.ts` — `createWord()` factory + `ValidWord` type-only brand (`unique symbol`, no runtime field).
- `errors.ts` — `Result<T,E>`, `ok`, `err`, error unions, `InvalidWordError`, `InvalidSRSStateError`.

### Persistence (`lib/db/`, `lib/services/`)
- `queries/words.ts` — `insert`, `findById`, `findByUserAndTerm`, `listByUser`, `deleteById`.
- `queries/srs.ts` — `initialize`, `getByWordId`, `findDue`.
- `queries/review-log.ts` — `append`, `listByUser`, `listByWord`.
- `queries/definition-cache.ts` — `lookup`, `write` (race-safe via `onConflictDoNothing`).
- `services/word.service.ts` — `save` (returns `Result<Word, CaptureError>`; duplicate detection).
- `services/srs.service.ts` — `listDue`, `recordReview` (one `db.transaction` with `SELECT FOR UPDATE` + state update + log append).

### Definition pipeline (`lib/services/`)
- `dict.client.ts` — dictionaryapi.dev fetch, 5s abort, returns first def-with-example.
- `llm.client.ts` — DeepSeek `deepseek-chat`, `response_format: json_object`, `temperature: 0`, `max_tokens: 200`, Zod-validated.
- `definition.service.ts` — pure composer with DI: normalize → invalid_term gate → cache → dict → llm. Cache writes failure-tolerant.

### API
- `app/api/capture/route.ts` — `POST /api/capture`. `getUserForApi` 401-or-User, Zod gate, typed error → HTTP (400/404/409/502/503). Strips `raw` / `cause` before responding.

### Test harness
- `vitest.config.ts` — unit tests, `server-only` shim.
- `vitest.integration.config.ts` — integration tests, swaps `DATABASE_URL` → `SUPABASE_TEST_DB_URL`, single forked worker, 30s timeout.
- `tests/integration/db/_helpers.ts` — raw postgres-js client for seeding `auth.users` + cleanup.
- MSW for dict + LLM HTTP mocking.

---

## DB connection topology

Three URLs to be aware of in `.env.local`:

| Var | Project | Pooler | Port | Used by |
|---|---|---|---|---|
| `DATABASE_URL` | `qbogwjfneuswzwdykoxf` (prod) | Transaction | 6543 | App runtime on Vercel (serverless) |
| `SUPABASE_TEST_DB_URL` | `ufiizhzljxrntjeluuhv` (test) | Session | 5432 | `pnpm test:integ` |
| (manual) | both | direct | 5432 | IPv6-only — fails from most laptops; do NOT use |

Schema is applied via Supabase SQL Editor on both projects (db:push fails over IPv6 from typical networks).

---

## Pending manual steps before Phase 4

### 1. Apply both SQL migrations to BOTH projects if not already done
For each project (prod + test):
1. Dashboard → SQL Editor → New query → paste `drizzle/0000_next_wallow.sql` → Run.
2. New query → paste `drizzle/0001_rls.sql` → Run.
3. Verify: `select tablename from pg_tables where schemaname='public';` → 5 tables.

### 2. Vercel deploy (when ready to ship Phase 4 UI)
- Dashboard → Add New Project → import GitHub repo `lesaathvik24/vocabmaxx`.
- Paste **all** `.env.local` keys into Project Settings → Environment Variables (production).
- **Critical:** `DATABASE_URL` on Vercel must use the **transaction pooler (port 6543)**, not 5432.

### 3. CI secret for integration tests (optional)
- GitHub repo → Settings → Secrets → Actions → add `SUPABASE_TEST_DB_URL`.
- Update `.github/workflows/ci.yml` to pass it through, or skip `test:integ` in CI and run locally only.

---

## How to run locally

```bash
pnpm install
pnpm dev                       # http://localhost:3000
pnpm test:unit                 # ~1s, 56 tests
pnpm test:integ                # ~60s, 34 tests, hits test Supabase
pnpm verify                    # lint + typecheck + unit + integration
```

`pnpm db:push` is unsupported over typical IPv6-restricted networks. Apply schema via SQL Editor.

---

## Manual end-to-end smoke test for Phase 1–3

Until Phase 4 UI ships, exercise the API directly. Sign in at `localhost:3000` then in DevTools console (same origin so cookies attach):

```js
// success — dict path
fetch('/api/capture',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({term:'ubiquitous'})}).then(r=>r.json().then(j=>console.log(r.status,j)))
// duplicate
fetch('/api/capture',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({term:'ubiquitous'})}).then(r=>r.json().then(j=>console.log(r.status,j)))
// LLM fallback (1 DeepSeek call, ≤ $0.0001)
fetch('/api/capture',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({term:'frabjous'})}).then(r=>r.json().then(j=>console.log(r.status,j)))
// invalid term
fetch('/api/capture',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({term:'123abc'})}).then(r=>r.json().then(j=>console.log(r.status,j)))
```

Expect: `200` / `409` / `200 (source: 'llm')` / `400`.

---

## Next phase

**Phase 4 — Capture UI + dashboard** (`docs/ROADMAP.md` Phase 4). Branches:
- 4.1 — App shell (Atelier).
- 4.2 — Dashboard (due banner + recent captures).
- 4.3 — Single-word capture page.
- 4.4 — Paragraph extract (LLM call + UI).
- 4.5 — Bulk import (.txt upload).

Phase 4 also requires `GET /api/words` and `GET /api/words/[id]` endpoints — add them as part of 4.2 / 4.3.

Service layer for Phase 4 is already in place — UI just consumes `wordService.listForUser`, `srsService.listDue`, and `POST /api/capture`.
