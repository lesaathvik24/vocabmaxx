# Technical Specification — VocabMaxx

**Audience:** the engineer implementing each feature. Every contract here is enforced by tests.
**Status:** v0.1 — locked for Phase 0; revise per phase as needed.

---

## 1. Database schema (Drizzle / Postgres)

`lib/db/schema.ts`:

```typescript
import { pgTable, uuid, text, timestamp, integer, doublePrecision, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const definitionSourceEnum = pgEnum('definition_source', ['dictionary', 'llm'])
export const importJobStatusEnum = pgEnum('import_job_status', ['pending', 'running', 'done', 'failed'])

export const words = pgTable('words', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    term: text('term').notNull(),
    definition: text('definition').notNull(),
    examples: jsonb('examples').$type<string[]>().notNull(),
    source: definitionSourceEnum('source').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
}, t => ({
    termUserUnique: uniqueIndex('words_user_term_idx').on(t.userId, t.term),
    userIdx: index('words_user_idx').on(t.userId),
}))

export const srsState = pgTable('srs_state', {
    wordId: uuid('word_id').primaryKey().references(() => words.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    easeFactor: doublePrecision('ease_factor').notNull().default(2.5),
    intervalDays: integer('interval_days').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    dueDate: timestamp('due_date', { withTimezone: true }).defaultNow().notNull(),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
}, t => ({
    dueIdx: index('srs_due_idx').on(t.userId, t.dueDate),
}))

export const reviewLog = pgTable('review_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    wordId: uuid('word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
    grade: integer('grade').notNull(),                       // 0 | 3 | 4 | 5
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).defaultNow().notNull(),
}, t => ({
    userTimeIdx: index('review_user_time_idx').on(t.userId, t.reviewedAt),
}))

export const importJobs = pgTable('import_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    status: importJobStatusEnum('status').notNull().default('pending'),
    totalTerms: integer('total_terms').notNull(),
    addedCount: integer('added_count').notNull().default(0),
    failedCount: integer('failed_count').notNull().default(0),
    errors: jsonb('errors').$type<{ term: string; reason: string }[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const definitionCache = pgTable('definition_cache', {
    term: text('term').primaryKey(),
    definition: text('definition').notNull(),
    examples: jsonb('examples').$type<string[]>().notNull(),
    source: definitionSourceEnum('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// supabase auth users — referenced only, not managed by Drizzle
export const authUsers = pgTable('users', {
    id: uuid('id').primaryKey(),
}, () => ({})).$schema('auth')
```

**Invariants enforced by DB constraints:**

- `(user_id, term)` unique on `words`.
- `ease_factor >= 1.3` enforced via `CHECK` (in `drizzle/0001_rls.sql`).
- `grade IN (0, 3, 4, 5)` enforced via `CHECK`.
- `examples` JSON-array length 1..3 enforced via `CHECK (jsonb_array_length(examples) BETWEEN 1 AND 3)`.

## 2. RLS policies

`drizzle/0001_rls.sql`:

```sql
alter table words enable row level security;
alter table srs_state enable row level security;
alter table review_log enable row level security;
alter table import_jobs enable row level security;
-- definition_cache: NO RLS, public read

create policy owner_all on words
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy owner_all on srs_state
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy owner_all on review_log
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy owner_all on import_jobs
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy public_read on definition_cache for select using (true);
-- INSERT/UPDATE on definition_cache via service role only
```

## 3. Domain layer

### `lib/domain/grade.ts`

```typescript
export const Grade = { Again: 0, Hard: 3, Good: 4, Easy: 5 } as const
export type Grade = typeof Grade[keyof typeof Grade]   // 0 | 3 | 4 | 5
export const GRADES = [Grade.Again, Grade.Hard, Grade.Good, Grade.Easy] as const
```

### `lib/domain/srs.ts`

```typescript
import { Grade } from './grade'

export interface SRSState {
    easeFactor: number
    intervalDays: number
    repetitions: number
}

export interface SRSResult {
    state: SRSState
    dueDate: Date
}

const MS_PER_DAY = 86_400_000

export function nextState(
    current: SRSState,
    grade: Grade,
    now: Date = new Date(),
): SRSResult {
    let reps: number
    let interval: number

    if (grade === Grade.Again) {
        reps = 0
        interval = 1
    } else {
        reps = current.repetitions + 1
        if (reps === 1) interval = 1
        else if (reps === 2) interval = 6
        else interval = Math.round(current.intervalDays * current.easeFactor)
    }

    const g = grade
    let ease = current.easeFactor + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02))
    ease = Math.max(1.3, ease)

    return {
        state: { easeFactor: ease, intervalDays: interval, repetitions: reps },
        dueDate: new Date(now.getTime() + interval * MS_PER_DAY),
    }
}

export const initialSRSState: SRSState = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 }
```

### Worked example (matches PRD glossary + unit tests)

Starting `{ ease: 2.5, interval: 0, reps: 0 }`, applied in sequence:

| Step | Grade | reps | interval (d) | ease |
|---|---|---|---|---|
| 1 | Good (4) | 1 | 1 | 2.50 |
| 2 | Good (4) | 2 | 6 | 2.50 |
| 3 | Good (4) | 3 | 15 | 2.50 |
| 4 | Easy (5) | 4 | 38 | 2.60 |
| 5 | Again (0) | 0 | 1 | 1.80 |

`tests/unit/srs.test.ts` asserts every cell in this table.

### `lib/domain/errors.ts`

```typescript
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export type DefinitionError =
    | { kind: 'not_found' }
    | { kind: 'no_fallback_available' }
    | { kind: 'malformed_llm_response'; raw: string }
    | { kind: 'network_failure'; cause: string }
    | { kind: 'rate_limited' }

export type CaptureError =
    | DefinitionError
    | { kind: 'duplicate_term' }
    | { kind: 'invalid_term' }

export type SRSError =
    | { kind: 'word_not_found' }
    | { kind: 'not_due'; nextDue: Date }
```

## 4. Service layer contracts

### `DefinitionService`

```typescript
export interface DefinitionService {
    fetch(term: string): Promise<Result<DefinitionResult, DefinitionError>>
}

export interface DefinitionResult {
    definition: string
    examples: string[]            // 1..3
    source: 'dictionary' | 'llm'
}
```

**Implementation (`lib/services/definition.service.ts`):**

```
fetch(term):
    1. term = term.trim().toLowerCase()
    2. if !/^[a-z][a-z'-]*$/.test(term): return err({ kind: 'invalid_term' })
    3. cached = await definitionCache.lookup(term)
       if cached: return ok({ ...cached })
    4. dictResult = await dictClient.fetch(term)
       if dictResult.ok: writeCache(dictResult.value); return ok(dictResult.value)
    5. if !env.DEEPSEEK_API_KEY: return err({ kind: 'no_fallback_available' })
    6. llmResult = await llmClient.fetch(term)
       if llmResult.ok: writeCache(llmResult.value); return ok(llmResult.value)
       else: return llmResult
```

### `SRSService`

```typescript
export interface SRSService {
    initialize(wordId: string, userId: string): Promise<void>
    listDue(userId: string, asOf: Date): Promise<WordWithSRS[]>
    recordReview(userId: string, wordId: string, grade: Grade, now: Date): Promise<Result<SRSResult, SRSError>>
}
```

### `ImportService`

```typescript
export interface ImportService {
    extractAdvancedTerms(text: string): Promise<Result<ExtractedTerm[], DefinitionError>>
    saveBatch(userId: string, terms: string[], onProgress?: (done: number, total: number) => void): Promise<BulkImportSummary>
}

export interface ExtractedTerm {
    term: string
    contextSnippet: string       // surrounding sentence from input
    confidence: number           // 0..1, from LLM
}

export interface BulkImportSummary {
    jobId: string
    added: string[]
    failed: { term: string; reason: string }[]
}
```

Throttle: `saveBatch` uses `Promise.all` over chunks of 5 to keep dict-API + LLM under rate limits.

### `AnalyticsService`

```typescript
export interface AnalyticsService {
    vocabGrowth(userId: string, windowDays: number): Promise<{ date: string; cumulative: number }[]>
    retentionRate(userId: string, windowDays: number): Promise<number>     // 0..1
    problemWords(userId: string, limit: number): Promise<WordWithStats[]>  // top failed
}
```

### `ExportService`

```typescript
export interface ExportService {
    asJSON(userId: string): Promise<string>
    asCSV(userId: string): Promise<string>
    asAnki(userId: string): Promise<Buffer>     // .apkg
}
```

## 5. API surface (REST, JSON)

All routes under `/api/`. Auth required unless noted. All responses include `{ data?, error? }` envelope.

### Capture

```
POST /api/capture
Body:  { term: string }
200:   { data: { word: Word } }
400:   { error: { kind: 'invalid_term' | 'no_fallback_available' } }
404:   { error: { kind: 'not_found' } }
409:   { error: { kind: 'duplicate_term' } }
502:   { error: { kind: 'malformed_llm_response' } }
503:   { error: { kind: 'network_failure' } }
```

### Review

```
GET  /api/review/due
200: { data: { cards: WordWithSRS[] } }

POST /api/review/grade
Body: { wordId: string, grade: 0 | 3 | 4 | 5 }
200:  { data: { nextDue: string, newState: SRSState } }
404:  { error: { kind: 'word_not_found' } }
```

### Words

```
GET    /api/words?filter=all|due|mastered&search=str
200:   { data: { words: WordWithSRS[] } }

GET    /api/words/[id]
200:   { data: { word: WordWithSRS, history: ReviewLog[] } }

PATCH  /api/words/[id]
Body:  { definition?: string, examples?: string[] }
200:   { data: { word: Word } }

DELETE /api/words/[id]
204:   (no body)
```

### Import

```
POST /api/words/import
Body: { mode: 'extract', text: string }
200:  { data: { candidates: ExtractedTerm[] } }

POST /api/words/import
Body: { mode: 'save', terms: string[] }
200:  { data: { jobId: string } }       // long-running, poll status

GET  /api/words/import/[jobId]
200: { data: { job: ImportJob } }
```

### Insights / Export

```
GET /api/insights
200: { data: { growth: [...], retention: number, problemWords: [...] } }

GET /api/export?format=json|csv|anki
200: file download (Content-Disposition)
```

### Cron

```
POST /api/cron/daily-digest
Headers: Authorization: Bearer ${CRON_SECRET}
For each user with notif-prefs.daily=true:
    count = listDue(user, now)
    if count > 0: resend.send(email, dailyDigestTemplate({ count, sampleWords }))
```

## 6. Zod schemas

`lib/validation/capture.schema.ts`:

```typescript
import { z } from 'zod'

export const captureSchema = z.object({
    term: z.string().min(1).max(64).regex(/^[A-Za-z][A-Za-z'\-]*$/),
})
export type CaptureInput = z.infer<typeof captureSchema>
```

`lib/validation/review.schema.ts`:

```typescript
export const gradeSchema = z.object({
    wordId: z.string().uuid(),
    grade: z.union([z.literal(0), z.literal(3), z.literal(4), z.literal(5)]),
})
```

`lib/validation/word.schema.ts`:

```typescript
export const editWordSchema = z.object({
    definition: z.string().min(1).max(500).optional(),
    examples: z.array(z.string().min(1).max(300)).min(1).max(3).optional(),
}).refine(d => d.definition || d.examples, 'at least one field required')
```

## 7. LLM contracts

### Definition fallback prompt (DeepSeek `deepseek-chat` — see [ADR 0007](ADR/0007-deepseek-over-anthropic.md))

```
System:
You are a vocabulary tutor for an advanced English speaker. Given a single word,
output strict JSON with one concise definition (≤ 25 words) and exactly two natural
usage examples drawn from contexts like podcasts, journalism, or conversation.
Do not output markdown. Do not include preamble or commentary.

User: {term}

Schema:
{ "definition": string, "examples": [string, string] }
```

Parsed with `definitionLLMSchema = z.object({ definition: z.string().min(1).max(500), examples: z.array(z.string().min(1)).length(2) })`. Schema mismatch → `{ kind: 'malformed_llm_response', raw }`.

### Paragraph extraction prompt

```
System:
Given a paragraph of English text, identify the advanced or unusual vocabulary
likely unfamiliar to a B2-level reader. Return strict JSON.
For each term include the lowercased form, the surrounding sentence as context,
and a confidence score 0..1.

User: {paragraph}

Schema:
{ "terms": [ { "term": string, "context": string, "confidence": number } ] }
```

Caps: max 20 terms returned. Filter by confidence > 0.5 before returning to client.

## 8. Auth integration

`lib/auth/server.ts` exposes:

```typescript
export async function getSession(): Promise<Session | null>
export async function requireUser(): Promise<User>   // throws Response(401) if missing
```

Every protected route handler starts:

```typescript
const user = await requireUser()
```

Middleware in `middleware.ts` enforces auth on `/(app)/*` server-side; if no session, redirect to `/auth/sign-in?next=...`.

## 9. Testing strategy

| Type | Tool | Where | When run |
|---|---|---|---|
| Unit (pure logic) | Vitest | `tests/unit/` | every commit, < 5s suite |
| Integration (DB) | Vitest + Supabase CLI local Postgres | `tests/integration/` | every PR |
| API contract | Vitest + MSW (no Next required) | `tests/integration/api/` | every PR |
| Component | Vitest + React Testing Library | colocated `*.test.tsx` | every PR |
| E2E | Playwright (Chromium + WebKit) | `tests/e2e/` | every PR |
| Visual regression | _none in v1_ — Claude Design handoff handles visuals | | |

**Coverage threshold:** 85% on `lib/domain/` and `lib/services/`. Views are not coverage-gated; they're covered by e2e.

**Mocking rule:** never mock domain modules. Mock external IO only (fetch, DB at the boundary).

## 10. CI pipeline

`.github/workflows/ci.yml`:

```
jobs:
    lint:        pnpm lint
    typecheck:   pnpm typecheck
    unit:        pnpm test:unit
    integration: spins up Supabase CLI + Postgres, runs pnpm test:integration
    e2e:         Playwright against vercel preview URL (waits for deploy)
    bundle-size: next build + bundle-analyzer comment on PR
```

All green required to merge to `main`.

## 11. Environment variables

```
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-only, definition_cache writes + cron
DEEPSEEK_API_KEY=                  # server-only, LLM fallback
DEEPSEEK_BASE_URL=https://api.deepseek.com  # override for self-hosted / proxy
DEEPSEEK_API_KEY=                  # word definition LLM fallback
DEEPSEEK_BASE_URL=https://api.deepseek.com
RESEND_API_KEY=                    # transactional email
CRON_SECRET=                       # for /api/cron/* auth
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

Server-only keys never end up in client bundle (no `NEXT_PUBLIC_` prefix).

## 12. Performance contracts

| Operation | P50 | P95 |
|---|---|---|
| `/api/capture` (dict hit) | 400ms | 1.5s |
| `/api/capture` (LLM fallback) | 1.5s | 4.0s |
| `/api/review/due` | 100ms | 300ms |
| `/api/review/grade` | 80ms | 250ms |
| `/api/words` (search) | 150ms | 500ms |

Measured via Vercel Speed Insights, asserted via Sentry transactions sampled at 10%.

---

**Cross-references**

- Why these architectural choices: [`ADR/`](ADR/).
- Live API documentation: [`api/openapi.yaml`](api/openapi.yaml).
- Phase-by-phase delivery: [`ROADMAP.md`](ROADMAP.md).
