# Architecture — VocabMaxx

**Audience:** engineers reading this repo cold. Recruiters who want to understand how it's built without reading code.
**Scope:** the whole system — frontend, backend, database, third-party services, deployment.

---

## 1. System diagram

```
                                  ┌────────────────────────────┐
                                  │  vocabmaxx.com (Vercel)    │
                                  └────────────┬───────────────┘
                                               │
                  ┌────────────────────────────┴────────────────────────────┐
                  │                                                          │
   ┌──────────────┴──────────────┐                          ┌────────────────┴────────────────┐
   │   Marketing pages            │                          │  Authenticated app pages         │
   │   app/(marketing)/           │                          │  app/(app)/                      │
   │   · /                        │                          │  · /dashboard                    │
   │   · /pricing                 │                          │  · /capture                      │
   │   · /about                   │                          │  · /review                       │
   │                              │                          │  · /words                        │
   │   Server Components only,    │                          │  · /insights                     │
   │   no auth, fully static      │                          │  · /settings                     │
   └──────────────────────────────┘                          └────────────┬─────────────────────┘
                                                                          │
                  ┌───────────────────────────────────────────────────────┴────┐
                  │ Route handlers (app/api/*)                                 │
                  │   POST /api/capture     POST /api/review/grade             │
                  │   GET  /api/words       POST /api/words/import             │
                  │   GET  /api/insights    GET  /api/export                   │
                  │                                                            │
                  │   Middleware: auth (Supabase SSR), rate-limit, Zod-parse   │
                  └───────────────────────────────────────────────────────┬────┘
                                                                          │
   ┌────────────────────────────────────────────────────────────────────┴────┐
   │ Service layer (lib/services/*) — pure, unit-testable                     │
   │   · DefinitionService  (dict → LLM hybrid + shared cache)                │
   │   · SRSService         (SM-2 pure function)                              │
   │   · ImportService      (paragraph → LLM extraction → batch capture)      │
   │   · AnalyticsService   (growth, retention, problem-word queries)         │
   │   · ExportService      (JSON / CSV / Anki .apkg)                         │
   └─────────────────────────────────────┬────────────────────────────────────┘
                                          │
                                Drizzle ORM (lib/db/*)
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │ Supabase                                       │
                  │ ├── auth.users    (email + Google OAuth)       │
                  │ ├── public.words      [RLS on user_id]         │
                  │ ├── public.srs_state  [RLS via words.user_id]  │
                  │ ├── public.review_log [RLS on user_id]         │
                  │ ├── public.import_jobs[RLS on user_id]         │
                  │ └── public.definition_cache [public read]      │
                  └────────────────────────────────────────────────┘

   ┌───────────────────────────┐    ┌─────────────────────────┐    ┌──────────────────────────┐
   │ Browser extension          │    │ Vercel Cron (daily)     │    │ Resend                   │
   │ extension/  (Plasmo)       │───▶│ /api/cron/daily-digest  │───▶│ Daily-digest email       │
   │ POST /api/capture          │    │                          │    │                          │
   └───────────────────────────┘    └─────────────────────────┘    └──────────────────────────┘

   ┌───────────────────────────┐    ┌─────────────────────────┐    ┌──────────────────────────┐
   │ DeepSeek                   │    │ Sentry                  │    │ PostHog                  │
   │ (server-side LLM calls)    │    │ (errors, performance)   │    │ (product analytics)      │
   └───────────────────────────┘    └─────────────────────────┘    └──────────────────────────┘
```

## 2. Repo layout

```
vocabmaxx/
├── app/                                Next.js App Router
│   ├── (marketing)/                    Public, unauthenticated
│   │   ├── page.tsx                    Landing
│   │   ├── pricing/page.tsx
│   │   └── about/page.tsx
│   ├── (app)/                          Authenticated, gated by middleware
│   │   ├── layout.tsx                  Sidebar + topbar shell
│   │   ├── dashboard/page.tsx
│   │   ├── capture/page.tsx
│   │   ├── review/page.tsx
│   │   ├── words/
│   │   │   ├── page.tsx                List
│   │   │   └── [id]/page.tsx           Detail
│   │   ├── insights/page.tsx
│   │   └── settings/page.tsx
│   ├── api/                            Route handlers
│   │   ├── auth/[...]/route.ts         Supabase auth callbacks
│   │   ├── capture/route.ts
│   │   ├── review/grade/route.ts
│   │   ├── words/route.ts
│   │   ├── words/[id]/route.ts
│   │   ├── words/import/route.ts
│   │   ├── insights/route.ts
│   │   ├── export/route.ts
│   │   └── cron/daily-digest/route.ts
│   ├── auth/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── callback/route.ts
│   ├── layout.tsx                      Root layout
│   └── globals.css
├── components/
│   ├── ui/                             shadcn primitives (Button, Input, …)
│   ├── layout/                         AppShell, Topbar, Sidebar
│   ├── marketing/                      Hero, FeatureGrid, CTA, Footer
│   ├── capture/                        AddWordInput, ParagraphExtractor, BulkUploader
│   ├── review/                         FlipCard, GradeButtons, SessionDoneScreen
│   ├── words/                          WordList, WordRow, WordDetail, WordEditor
│   └── insights/                       GrowthChart, RetentionGauge, ProblemWords
├── lib/
│   ├── domain/                         Pure, no React imports
│   │   ├── srs.ts                      SM-2 nextState()
│   │   ├── word.ts                     Word type + invariants
│   │   ├── grade.ts                    Grade enum
│   │   └── errors.ts                   Typed error unions
│   ├── services/                       Pure functions / classes
│   │   ├── definition.service.ts
│   │   ├── dict.client.ts
│   │   ├── llm.client.ts
│   │   ├── srs.service.ts
│   │   ├── import.service.ts
│   │   ├── analytics.service.ts
│   │   └── export.service.ts
│   ├── db/
│   │   ├── schema.ts                   Drizzle schema
│   │   ├── client.ts                   Drizzle client
│   │   └── queries/                    Co-located query modules
│   ├── auth/
│   │   ├── server.ts                   Supabase server client (RSC, route handlers)
│   │   ├── client.ts                   Supabase browser client
│   │   └── middleware.ts               Auth gate for /(app)
│   ├── validation/                     Zod schemas (shared client/server)
│   │   ├── capture.schema.ts
│   │   ├── word.schema.ts
│   │   └── review.schema.ts
│   ├── analytics/
│   │   └── posthog.ts
│   └── utils/
│       ├── result.ts                   Result<T, E> helpers
│       ├── rate-limit.ts
│       └── format.ts
├── drizzle/
│   ├── 0000_init.sql
│   ├── 0001_rls.sql
│   └── meta/
├── tests/
│   ├── unit/                           Vitest unit
│   ├── integration/                    Vitest + local Postgres
│   └── e2e/                            Playwright
├── extension/                          Plasmo browser extension
├── public/
│   ├── manifest.json
│   └── icons/
├── docs/                               See README.md
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml                      (no-op; Vercel handles deploys)
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── package.json
└── pnpm-lock.yaml
```

## 3. Layer responsibilities

### Domain layer (`lib/domain/`)
Pure TypeScript. Zero React, zero Next, zero Drizzle, zero Supabase imports. The SM-2 algorithm and Word/Grade types live here. Anything in this layer must be 100% unit-testable with Vitest in isolation. **Rule:** if a function in this layer references anything outside `lib/domain/`, it's in the wrong layer.

### Service layer (`lib/services/`)
Composes domain logic with side effects (DB, HTTP, file system). Each service is either a pure function module (e.g. `srs.service.ts` wrapping `nextState()` with DB persistence) or a small class. Services are exposed through plain TypeScript interfaces; tests inject in-memory or mocked implementations.

**Rule:** services know about Drizzle and fetch. They do not know about React or Next.js. They never return Response objects; they return `Result<T, E>`.

### API layer (`app/api/`)
Thin. Each route handler:

1. Authenticates via `lib/auth/server.ts`.
2. Validates the request via the relevant Zod schema.
3. Calls one or more services.
4. Maps the `Result<T, E>` to an `NextResponse`.

No business logic here. If a route is more than ~40 lines, the logic belongs in a service.

### View layer (`app/(app)/`, `components/`)
React Server Components by default. Client Components only where state, browser APIs, or interactivity demand them. Components consume services via custom hooks that wrap `fetch` against the API layer (`lib/hooks/`). **Never** call services directly from a Client Component — always through the API.

## 4. Data flow examples

### Example A: capturing a single word

```
1. User types "ubiquitous" → presses Enter on /capture
2. <AddWordInput> client component → fetch POST /api/capture { term: "ubiquitous" }
3. /api/capture handler:
   a. supabaseServer.auth.getUser() — verify session
   b. captureSchema.parse(body) — Zod validates
   c. definitionService.fetch("ubiquitous")
        i.  checks definition_cache table
        ii. cache miss → dictClient.fetch() → has examples → return + write cache
   d. wordsRepo.insert({ user_id, term, definition, examples, source: 'dictionary' })
   e. srsRepo.initialize(word_id) — creates SRS state row with due_date = now()
   f. returns { word: {...} }
4. Client revalidates the word list and shows toast "ubiquitous added"
```

### Example B: review session grade

```
1. User taps "Good" on a flipped card
2. <GradeButtons> client → fetch POST /api/review/grade { word_id, grade: 4 }
3. /api/review/grade handler:
   a. auth check
   b. gradeSchema.parse(body)
   c. srsService.recordReview(user_id, word_id, grade)
        i.   loads current SRS state
        ii.  computes nextState() — pure SM-2 function
        iii. updates srs_state row (ease_factor, interval_days, repetitions, due_date)
        iv.  inserts review_log row (audit trail)
   d. returns { next_due: timestamp }
4. Client advances to next card or shows "Session done"
```

### Example C: paragraph capture

```
1. User pastes a 4-paragraph Lex Fridman transcript into <ParagraphExtractor>
2. POST /api/words/import { text, mode: "extract" }
3. Handler:
   a. auth + Zod
   b. importService.extractAdvancedTerms(text)
        i.  calls llmClient.extract(text) — DeepSeek deepseek-chat, JSON-structured
        ii. returns Term[] with confidence scores
   c. returns { candidates: Term[] }
4. Client renders checklist; user confirms which to add
5. POST /api/words/import { terms: [...], mode: "save" }
6. Handler runs definitionService.fetch in parallel (throttled to 5 concurrent)
7. Returns BulkImportSummary { added, failed }
```

## 5. Multi-tenancy model

Every domain table has a `user_id uuid not null references auth.users(id) on delete cascade`. RLS enabled on every domain table. The policy is the same shape for all:

```sql
create policy "owner_select" on words for select using ( auth.uid() = user_id );
create policy "owner_insert" on words for insert with check ( auth.uid() = user_id );
create policy "owner_update" on words for update using ( auth.uid() = user_id );
create policy "owner_delete" on words for delete using ( auth.uid() = user_id );
```

The `definition_cache` table is the exception: it has no `user_id` and allows public read so that cached definitions are shared across all users. Inserts are server-side only via the service role key.

API routes always use the **anon key with the user's session JWT**, never the service role key, except for:
- `definition_cache` writes
- the daily-digest Vercel Cron handler (which iterates users and queries on their behalf)

## 6. Auth flow

1. User clicks "Sign in with Google" on `/auth/sign-in`.
2. Supabase redirects to Google.
3. Google redirects back to `/auth/callback?code=...`.
4. Callback exchanges the code for a session, sets HTTP-only cookies, redirects to `/dashboard`.
5. Every subsequent request: `lib/auth/middleware.ts` checks for the session cookie. Missing or invalid → redirect to `/auth/sign-in`.

Email magic-link follows the same pattern, with Supabase emailing the link directly.

## 7. Caching

| Cache | Where | Invalidation |
|---|---|---|
| Definition lookups | `definition_cache` Postgres table, keyed by `term` (lowercased) | Manual purge only. Definitions don't go stale. |
| Word list | Next.js `revalidate` + React Query client cache | On capture, edit, delete. |
| Review queue | React Query, refetched on grade | After each card graded. |
| Insights | SQL views, ETag headers on response | Refreshed on every page load. |

## 8. Error handling

Two distinct paths:

### Expected errors (4xx)
Return typed errors via `Result<T, E>` from services. API layer maps to HTTP status + JSON body:

```typescript
type DefinitionError =
  | { kind: 'not_found' }              // → 404
  | { kind: 'no_fallback_available' }  // → 400
  | { kind: 'malformed_llm_response' } // → 502
  | { kind: 'network_failure'; cause: string } // → 503
```

### Unexpected errors (5xx)
Bubble to Next.js's `error.tsx`. Sentry captures with full stack + request context. User sees a friendly retry banner.

**Rule:** never `catch (e) {}`. Either handle the specific case or let it bubble.

## 9. Observability

| Signal | Tool | Granularity |
|---|---|---|
| Errors (server + client) | Sentry | Per-issue with breadcrumbs |
| Web vitals | Vercel Analytics | LCP, FID, CLS per page |
| Product events (capture, review-graded, import) | PostHog | Per-user-per-event |
| Logs | Vercel Logs | Per-deployment |
| DB performance | Supabase dashboard | Slow query log |

Daily digest of error rate + capture rate posted to user's email (via Resend) — same channel as the daily review reminder.

## 10. Deployment

- **Branch model:** single `main` branch.
- **PR previews:** every PR gets a Vercel preview URL.
- **Production:** push to `main` → Vercel deploys.
- **DB migrations:** Drizzle migrations checked in. CI runs `drizzle-kit migrate` against a temp DB; on `main`, runs against Supabase prod (via Supabase CLI service role token).
- **Rollback:** Vercel one-click rollback to previous deploy. DB rollbacks are manual via reverse migrations; see [`RUNBOOK.md`](RUNBOOK.md).

## 11. Performance budget

| Page | LCP target | Bundle (JS, gzipped) target |
|---|---|---|
| `/` (marketing) | < 1.5s | < 50 kB |
| `/dashboard` | < 2.0s | < 120 kB |
| `/review` | < 1.5s | < 100 kB |
| `/words` | < 2.0s | < 150 kB (virtualized list) |

CI gate: bundle size check via `@next/bundle-analyzer` in a comment on PRs (no hard fail; informational).

## 12. Open questions / future work

- **FSRS migration:** v2 may replace SM-2 with FSRS once the user base has > 1000 review events for tuning. See [`ADR/0006`](ADR/0006-sm2-vs-fsrs.md).
- **pgvector for similarity:** future feature — "show me related words to my problem words" requires embedding storage. Schema reserves room.
- **Stripe paid tier:** architecture supports plan checks at the API layer. Implementation deferred to v2.

---

**Cross-references**

- Service contracts and DB schema details: [`TECH_SPEC.md`](TECH_SPEC.md).
- Security model and threat scenarios: [`SECURITY.md`](SECURITY.md).
- Ops procedures: [`RUNBOOK.md`](RUNBOOK.md).
- Why these choices: [`ADR/`](ADR/).
