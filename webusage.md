# webusage.md — Work log

This file records exactly what was done for each requested task and how, during the
`claude/learning-app-perf-features-5msa7s` session on 2026-06-10.

Tasks requested:

1. Grade registration (Again/Hard/Good/Easy) takes >1s — fix it or show a small loading bar.
2. Switching tabs (e.g. Dashboard from another tab) is slow to load.
3. Give an option to delete words.
4. After "caught up", provide a way to keep reviewing again and again (algorithm-safe).
5. Give a method to actually test the algorithm.

---

## Task status

- [x] 1 — Grade latency
- [x] 2 — Tab navigation latency
- [x] 3 — Delete words
- [x] 4 — Keep reviewing (practice mode)
- [x] 5 — Algorithm test sandbox

---

## Task 1 — Grade registration latency

**Root cause.** In `components/review/ReviewSession.tsx`, `handleGrade` did
`await fetch('/api/review/grade', …)` and only advanced to the next card *after* the
response returned. The `/api/review/grade` handler runs a DB transaction
(`SELECT … FOR UPDATE` + update + log insert) against Supabase from a serverless
function, so the round-trip (plus any cold start) routinely took >1s. During that time
the buttons were disabled and the card sat still — that's the "over a second to
register" delay.

**Fix — optimistic UI.** The next SRS state is computed server-side and is
deterministic, so there is no need to block the UI on the network. `handleGrade` now:

- Calls `advance(session)` **immediately** on click, so the next card appears instantly.
- Fires the grade `POST` in the background (fire-and-forget, `void fetch(...)`).
- Tracks the number of in-flight saves in `savingCount` and shows a small, non-blocking
  "Saving" indicator (spinner) next to the card counter — this is the "small loading
  bar" requested, without ever blocking input.
- On a failed/blocked save, shows a `toast.error` naming the word ("…it may resurface"),
  since the optimistic advance is not rolled back.

**Files changed:** `components/review/ReviewSession.tsx` (rewritten),
`components/review/SessionDoneScreen.tsx` (new `practice` prop, see Task 4).

**How to verify:** Start a review, flip a card, press a grade — the next card appears
with no perceptible delay; a tiny "Saving" spinner flashes in the header.

---

## Task 2 — Tab navigation feels slow

**Root cause.** Every app tab (`/dashboard`, `/review`, `/words`, `/insights`) is a
`force-dynamic` server component that awaits DB queries before rendering. With no
`loading.tsx`, Next.js keeps the *previous* page on screen until the new server
component's data resolves, so switching tabs looks like it "hangs".

**Fix.** Added `app/(app)/loading.tsx` — a skeleton that Next.js renders **instantly**
for any child route segment in the `(app)` group while its server data loads. Tab
switches now show an immediate skeleton instead of a frozen previous page.

**Files added:** `app/(app)/loading.tsx`.

**How to verify:** Click between Dashboard / Review / Words — a skeleton appears
immediately on each switch, then resolves to content.

---

## Task 3 — Delete words

Previously `/words` and `/words/[id]` were "Coming soon" placeholders and there was no
delete endpoint. Implemented an end-to-end delete flow:

1. **User-scoped delete query** — `lib/db/queries/words.ts` adds
   `deleteByIdForUser(id, userId)`. It deletes only when the row's `user_id` matches and
   returns a boolean (true if a row was removed). `srs_state` and `review_log` rows
   cascade via the existing `onDelete: 'cascade'` FKs. The old `deleteById` is kept (used
   by an integration test).
2. **Service** — `lib/services/word.service.ts` `remove(id, userId)` now delegates to the
   scoped query and returns the boolean (ownership-safe; can't delete another user's word).
3. **API** — new `app/api/words/[id]/route.ts` `DELETE` handler: auth via
   `getUserForApi` (401 if signed out), UUID-validates the id (400), calls
   `wordService.remove`, returns 404 if nothing was deleted, 200 otherwise.
4. **UI** — `/words` is now a real library page:
   - `app/(app)/words/page.tsx` (server) lists the user's words via
     `wordService.listForUser`.
   - `components/words/WordsList.tsx` (client) renders the list with a search box and a
     trash button per row. Delete asks for confirmation in a `Dialog`, calls
     `DELETE /api/words/:id`, toasts success/error, and `router.refresh()`es the list.

**Files added:** `app/api/words/[id]/route.ts`, `components/words/WordsList.tsx`.
**Files changed:** `app/(app)/words/page.tsx`, `lib/db/queries/words.ts`,
`lib/services/word.service.ts`.

**How to verify:** Go to **Words**, search to filter, click the trash icon → confirm →
the word disappears and a success toast shows.

---

## Task 4 — Keep reviewing after "caught up" (algorithm-safe)

Per the chosen approach, extra reviewing must **not** change the SRS schedule, so a
**Practice (cram) mode** was added that flips through words without persisting grades.

- **Review page** (`app/(app)/review/page.tsx`) now reads `?mode=practice`:
  - Practice mode loads **all** captured words (`wordService.listForUser`) and renders
    `ReviewSession` with `practice`.
  - The "All caught up" screen was replaced with a `CaughtUp` component that, when the
    user has at least one word, offers a **"Practice anyway"** button (→
    `/review?mode=practice`) alongside "Capture a word".
- **ReviewSession** (`components/review/ReviewSession.tsx`) takes a `practice` prop. In
  practice mode `handleGrade` advances locally and **returns before any `fetch`** — the
  server / SRS state is never touched. A "Practice" badge and a "your review schedule
  won't change" note are shown.
- **SessionDoneScreen** (`components/review/SessionDoneScreen.tsx`) takes `practice`,
  adjusts copy, and gains a **"Keep reviewing"** button (→ `/review?mode=practice`) so the
  user can loop indefinitely after any session.

**Algorithm safety:** practice grades are discarded client-side; no `/api/review/grade`
call is made, so `srs_state` / `review_log` are unaffected.

**Files changed:** `app/(app)/review/page.tsx`, `components/review/ReviewSession.tsx`,
`components/review/SessionDoneScreen.tsx`.

**How to verify:** Finish your due cards (or when "All caught up"), click "Practice
anyway" / "Keep reviewing" — you can flip through all words repeatedly; the Review badge
/ due count never changes from practicing.

---

## Task 5 — A method to actually test the algorithm

Added an interactive **Algorithm lab** that runs the *exact* production SM-2 function
(`lib/domain/srs.ts` `nextState`) in the browser, so the scheduling can be verified
directly on Vercel.

- `components/algorithm/AlgorithmLab.tsx` (client): starts from `initialSRSState`, shows
  the current interval / ease factor / repetitions, and four grade buttons (Again / Hard /
  Good / Easy). Each button also previews what it *would* do from the current state
  (`→ Nd · ef X.XX`). Pressing a grade applies `nextState` and appends a row to a history
  table (step, grade, interval, ease, reps, due-in-days). A Reset button clears it. A
  fixed anchor date is used so "due in" is deterministic.
- `app/(app)/algorithm/page.tsx` (server) wraps it and exports metadata.
- Added an **"Algorithm lab"** entry (flask icon) to the sidebar nav
  (`components/layout/Sidebar.tsx`).

This complements the existing automated tests (`tests/unit/srs.test.ts` — 20 cases) by
giving a hands-on way to exercise the algorithm. `lib/domain/srs.ts` is pure (no
`server-only`), so it is safe to import client-side.

**Files added:** `components/algorithm/AlgorithmLab.tsx`, `app/(app)/algorithm/page.tsx`.
**Files changed:** `components/layout/Sidebar.tsx`.

**How to verify:** Open **Algorithm lab** from the sidebar; press grades and watch the
interval/ease/due evolve. e.g. from the initial state: Good → 1d, Good → 6d, Good →
~15d, matching SM-2.

---

## Verification run (sandbox)

- `pnpm typecheck` — clean.
- `pnpm lint` — clean (the single pre-existing warning is in `tests/unit/middleware.test.ts`,
  not in any file changed here).
- `pnpm test:unit` — 80/80 passing.
- `pnpm build` — app code **compiles** and TypeScript passes; the build then fails only
  while *prerendering* `/auth/sign-in` because Supabase env vars are absent in this
  sandbox (`@supabase/ssr: Your project's URL and API key are required`). This is
  environment-only and pre-existing — no auth files were changed — and does not occur on
  Vercel where the env vars are configured.

Integration tests (`pnpm test:integ`) were not run here as they require a live test
Supabase (`SUPABASE_TEST_DB_URL`) not available in this sandbox.

---

## Follow-up — Vercel build failure on `/auth/sign-in` (fixed)

**Symptom.** Vercel build failed:
`Error occurred prerendering page "/auth/sign-in"` →
`@supabase/ssr: Your project's URL and API key are required to create a Supabase client!`

**Root cause.** `app/auth/sign-in/page.tsx` and `app/auth/sign-up/page.tsx` render
`components/auth/AuthCard.tsx`, a client component that calls `createClient()` (→
`createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, …ANON_KEY!)`) **at render
time**. These two pages had no dynamic flag, so Next.js tried to **statically
prerender** them at build. During static export the `NEXT_PUBLIC_*` values weren't
present, so the client constructor threw and aborted the build.

**Fix.** Added `export const dynamic = 'force-dynamic'` to both auth pages so they are
server-rendered on demand instead of prerendered at build — matching the `(app)` pages.
After the change `pnpm build` completes locally and the route table shows
`/auth/sign-in` and `/auth/sign-up` as `ƒ (Dynamic)`.

**Files changed:** `app/auth/sign-in/page.tsx`, `app/auth/sign-up/page.tsx`.

**Important Vercel env note.** `NEXT_PUBLIC_*` vars are inlined into the client bundle
**at build time**. This branch deploys to Vercel's **Preview** environment, so make sure
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, and the
other keys from `.env.local` are configured for **Preview** (not only Production) — the
likely reason the env was missing at build. With the dynamic fix the build will no
longer crash even if a var is briefly missing, but the auth UI needs the
`NEXT_PUBLIC_*` values present at build to function in the browser.

---

# Phase 6 — Word list, detail, search (2026-06-10)

Goal for this session: finish Phase 6 and Phase 7 from `docs/ROADMAP.md`, with unit
tests + manual validation steps per task. Branch: `claude/learning-app-perf-features-5msa7s`.

## 6.1a / 6.1b — Word list: status filter + virtualization + unit tests

**What was missing.** The list shipped earlier had search + delete but no
All/Due/Mastered filter and no virtualization (roadmap `[~]`), and there were no unit
tests for the list logic.

**Process & changes.**

1. **Pure, client-safe logic module** — `lib/words/filter.ts`:
   - `repsToStatus(reps)` → `new | learning | review | mastered` (mirrors
     `dashboard.service.repsToStatus`, but dependency-free so client code can import it —
     `dashboard.service` is `server-only`).
   - `filterWords(words, { query, filter })` — applies the All/Due/Mastered filter then a
     case-insensitive substring match over term + definition. Pure → unit-testable.
2. **SRS-joined query** — `lib/db/queries/words.ts` `listWithSrsByUser(userId)` LEFT JOINs
   `srs_state` so each row carries `repetitions` + `dueDate` (left join so a word with no
   srs row still shows, treated as new / now-due). Returns `WordListRow`.
3. **Service** — `word.service.listWithStatus(userId, now)` maps those rows to
   `WordWithStatus` (adds `status` via `repsToStatus`, `due` = dueDate ≤ now).
4. **Page** — `app/(app)/words/page.tsx` now calls `listWithStatus` and passes `status` +
   `due` into each `WordRow`.
5. **UI** — `components/words/WordsList.tsx` rewritten:
   - Segmented **All / Due / Mastered** filter (tablist, `aria-selected`).
   - Filtering delegated to the pure `filterWords` (search + filter combined).
   - **Virtualization**: lists over 50 rows render through `VirtualRows`, a self-contained
     windowing component (fixed 68px row height, 640px viewport, 6-row overscan, absolute
     positioning inside a full-height spacer). No new dependency added (network-restricted
     env) — implemented by hand. Lists ≤ 50 rows render normally.
   - Rows are now clickable (role=link, Enter/Space) → navigate to `/words/[id]`; the trash
     button `stopPropagation`s so deleting doesn't open the detail page. Status + Due pills
     per row.

**Unit tests** — `tests/unit/word-list.test.ts` (17 cases): `repsToStatus` boundaries,
search by term/definition (case-insensitive, trim, no-match), and the All/Due/Mastered
filter incl. combined filter+search. Plus `tests/unit/word.service.test.ts` covers
`listWithStatus` status/due derivation (query layer mocked).

## 6.2a — Word detail page

**Data.** `lib/db/queries/words.ts` `findByIdForUser(id, userId)` (owner-scoped fetch).
`word.service.getDetail(id, userId)` returns `{ word, status, due, srs, history }` —
combining the word, its `srs_state` (via `srsQ.getByWordId`) and its review history (via
`reviewLogQ.listByWord`). Null when not found / not owner.

**UI.** `app/(app)/words/[id]/page.tsx` (server, `force-dynamic`): validates the id is a
UUID (`notFound()` otherwise), loads `getDetail`, `notFound()` if null, serializes dates to
ISO and renders `components/words/WordDetail.tsx`. The detail component shows term + status
+ due pills, definition, examples, an SRS stat grid (reps / interval / ease / next due) and
the review-history list with coloured grade labels (Again/Hard/Good/Easy). Replaces the old
"Word pages coming soon" placeholder.

## 6.2b — Word edit (+ delete)

Delete already existed. Added **edit**:

- **Query** — `words.updateForUser(id, userId, { definition?, examples? })` updates only the
  owner's row, returns the updated `Word` or null.
- **Service** — `word.service.update(...)` validates (definition non-empty; examples trimmed
  to 1–3 non-empty) → `Result<Word, { kind: 'word_not_found' | 'invalid_word' }>`.
- **API** — `PATCH /api/words/[id]` (`app/api/words/[id]/route.ts`): auth (401), UUID (400),
  Zod body (`definition?`, `examples?` 1–3, at least one present; 400 otherwise),
  `word_not_found` → 404, `invalid_word` → 400, else 200 `{ data: { word } }`.
- **UI** — `components/words/WordEditor.tsx` dialog (definition textarea + 1–3 example
  inputs, add/remove) wired into `WordDetail` via an "Edit" button; PATCH → toast →
  `router.refresh()`. Delete in `WordDetail` uses a confirm dialog → `DELETE` → back to
  `/words`.

**Unit tests** — `tests/unit/word.service.test.ts` (6 cases): update validation
(empty def, 0 / >3 examples, trim+persist valid patch, not-found mapping) with the query
layer mocked.

## Phase 6 verification run

- `pnpm test:unit` — green (**103** tests, +23 from Phase 5's 80).
- `pnpm typecheck` — clean.
- `pnpm lint` — clean (only the pre-existing `tests/unit/middleware.test.ts` `any` warning).
- Integration/E2E not run here (need live Supabase / dev server — unavailable in sandbox).

### Manual validation (do this on Vercel to confirm Phase 6)

1. **Words list** → search "ali" (or any fragment) → only matching rows; clear → all return.
2. Click the **Due** filter → only rows tagged "Due"; **Mastered** → only mastered rows;
   **All** → everything. Combine a filter with a search term → both apply.
3. With 250+ words, scroll the list → smooth (windowed); only ~15 rows in the DOM at a time
   (check DevTools Elements).
4. Click a row → **word detail** opens: definition, examples, reps/interval/ease/next-due,
   and review history.
5. On detail, **Edit** → change the definition / add an example → Save → toast → reload →
   change persisted.
6. **Delete** (from a row's trash icon or the detail page) → confirm → row gone; the word's
   `srs_state` / `review_log` rows are gone too (FK cascade).

---

# Phase 7 — Insights (2026-06-10)

## Approach decision — no required migration

The roadmap calls for SQL views in `drizzle/0002_views.sql`. To avoid forcing a manual
migration (a setup blocker), analytics are computed **in-app** with plain aggregation
queries over `words` / `review_log`, so the feature works on Vercel with **zero DB setup**.
`drizzle/0002_views.sql` is still shipped as an **optional** artifact (with
`security_invoker = true`) for direct SQL / BI access and parity with `TECH_SPEC §4`; the
app does not depend on it. The only manual step is having some review history to see
non-empty charts.

## 7.1 — Analytics queries (+ optional views) + tests

`lib/db/queries/analytics.ts` (`server-only`, Drizzle `sql` aggregation):
- `countWordsBefore(userId, since)` — growth baseline.
- `dailyAddedCounts(userId, since)` — words added per UTC day (`to_char(date_trunc('day', …))`).
- `reviewOutcomes(userId, since)` — `{ total, passed }` where passed = grade ≥ 3.
- `topFailedWords(userId, limit)` — words ranked by lapses (grade 0), zero-lapse excluded
  (`having sum(...) > 0`), owner-scoped via `innerJoin` on `words`.

`drizzle/0002_views.sql` — `vocab_growth_daily`, `retention_30d`, `top_failed_words`
(optional, documented as such in the file header).

**Tests:** `tests/integration/db/analytics.test.ts` (4 cases — growth baseline + daily
counts, review outcomes window, top-failed ranking/exclusion, owner scoping). Seeds words
with back-dated `added_at` and review_log rows. Not run in sandbox (needs live Supabase),
consistent with other `tests/integration/db/*`.

## 7.2 — AnalyticsService

`lib/services/analytics.service.ts` — typed methods matching the `TECH_SPEC §4` contract,
using the dashboard-style **injectable deps** pattern for unit testing:
- `vocabGrowth(userId, windowDays)` → `{ date, cumulative }[]` (dense, one point/day).
- `retentionRate(userId, windowDays)` → `0..1` (0 when no reviews — no divide-by-zero).
- `problemWords(userId, limit)` → `WordWithStats[]`.
- Exported pure helper `buildGrowthSeries(baseline, daily, windowDays, now)` fills every day
  in the window and accumulates — unit-tested in isolation.

**Tests:** `tests/unit/analytics.service.test.ts` (10 cases — `buildGrowthSeries` density /
baseline / accumulation, plus each service method with mock deps).

## 7.3a/b/c — Insights UI

Static, server-renderable SVG (no chart dependency, no `'use client'`):
- `lib/insights/chart.ts` — pure `buildGrowthGeometry(points, w, h, pad)` → line + closed
  area SVG paths + coords (max floored at 1 so all-zero series still renders). Unit-tested
  in `tests/unit/insights-chart.test.ts` (7 cases).
- `components/insights/GrowthChart.tsx` — area+line chart, total + gained header, date axis,
  empty state.
- `components/insights/RetentionGauge.tsx` — SVG ring gauge, colour by band
  (≥85% success / ≥60% warning / else destructive), sample-size empty state.
- `components/insights/ProblemWords.tsx` — top-misses list, each row links to the word
  detail page, empty state.
- `app/(app)/insights/page.tsx` (server, `force-dynamic`) — `Promise.all` over the three
  service calls (+ `reviewOutcomes` for the gauge sample size), renders all three widgets.
  Replaces the "Insights are brewing" placeholder.

## Phase 7 verification run

- `pnpm test:unit` — green (**117** tests, +14 from Phase 6's 103).
- `pnpm typecheck` — clean.
- `pnpm lint` — clean (only the pre-existing `middleware.test.ts` warning).
- `pnpm build` — **succeeds**; `/insights`, `/words`, `/words/[id]` all compile as `ƒ Dynamic`.
- Integration test written but not run here (needs live Supabase).

### Manual validation (do this on Vercel to confirm Phase 7)

1. Open **Insights**. With no reviews/words yet, the three widgets show their empty states.
2. Capture several words over a few days (or backdate `words.added_at` in Supabase) → the
   **growth curve** climbs and the total/“+N this window” header updates.
3. Do some reviews grading a mix of Again/Hard/Good/Easy → the **retention gauge** shows
   `passed(grade≥3)/total` as a % with the review count, coloured by band.
4. Repeatedly grade one word **Again** → it appears in **Problem words** with its miss count;
   click it → opens that word's detail page.
5. (Optional) Apply `drizzle/0002_views.sql` in the Supabase SQL editor and
   `select * from vocab_growth_daily` → matches the in-app chart.

---

# Performance findings — "whole app is slow" (2026-06-10, NOT yet fixed)

Diagnosis only — **no code was changed**. Captured here so a follow-up session can pick it
up. The slowness is structural (auth + DB round-trips per navigation), not in the Phase 6/7
feature code. Ranked by likely impact. 🔴 = biggest.

## 1. 🔴 Auth token re-validated over the network 3× per navigation (likely dominant)

`supabase.auth.getUser()` is **not** a local cookie read — it round-trips to Supabase Auth
(GoTrue) to revalidate the JWT every call (~100–300ms each). One `(app)` page load calls it
**three times, sequentially**:

- `lib/auth/middleware.ts:26` — `updateSession()` → `getUser()`
- `app/(app)/layout.tsx:6` — `requireUser()` → `getUser()`
- the page itself, e.g. `app/(app)/dashboard/page.tsx`, `app/(app)/words/page.tsx`,
  `app/(app)/insights/page.tsx` — `requireUser()` → `getUser()` (see `lib/auth/server.ts:29`)

So ~3 auth round-trips run before any data query starts.

**Fix options (no behaviour change):**
- Wrap `requireUser` / `createClient` in React `cache()` so the **layout + page** calls dedupe
  to one per request (kills 1 of 3 instantly).
- Middleware already validated the session, so server components don't need a fresh network
  check: use `getClaims()` (verifies the JWT signature locally via JWKS — no round-trip) or
  read the user from a middleware-forwarded header. Keep the single authoritative
  `getUser()` in middleware only.
- **Target: 1 network auth check per navigation instead of 3.**

## 2. 🔴 DB connection pool capped at 1 (`max: 1`)

`lib/db/client.ts:21` → `postgres(url, { prepare: false, max: 1, idle_timeout: 20, ... })`.
With `max: 1`, `Promise.all([...])` query batches (e.g. `dashboard.service.getDashboardData`'s
3 queries, insights' 4) **queue on a single connection and run serially**, not in parallel.

**Fix:** raise `max` to a small number (3–5) so parallel queries are actually parallel. The
Supabase transaction pooler (`:6543`) handles this; keep it small per instance to avoid
exhausting the pooler across many serverless instances.

## 3. 🟠 Vercel function region vs Supabase region (check first — cheapest win)

If Vercel functions run in a different region than the Supabase project, **every** auth call
and query pays cross-region RTT (~150ms each way). Combined with items 1+2 (≈3 auth + 3–4
queries, serialized), a mismatch alone can add 1–2s.

**Fix / check (USER, no code):** Vercel → Project → Settings → Functions region vs the
Supabase project region — make them match. This is the single cheapest lever if mismatched.

## 4. 🟠 Duplicate `countDue` query per dashboard load

`app/(app)/layout.tsx:7` runs `countDue` for the sidebar badge, and the dashboard page runs
it again inside `getDashboardData` → same query twice per dashboard navigation.

**Fix:** compute once and share (cached function), or drop it from one of the two.

## 5. 🟡 `force-dynamic` on every route = zero caching

Every `(app)` page re-runs full SSR + all DB queries on each visit. Most data is genuinely
per-user/per-request, so this is a smaller lever, but:

**Fix:** for slowly-changing per-user data (e.g. the sidebar due-count), add a short
`revalidate` / `unstable_cache` (few seconds) to skip repeat work.

## 6. 🟡 Cold starts (function + DB TLS handshake)

First request after idle pays serverless cold start **plus** a fresh TLS handshake to the
pooler; `idle_timeout: 20` drops the connection quickly between requests.

**Fix:** Vercel Fluid Compute / keep-warm and/or a longer `idle_timeout`. Infra-level — do
after 1–4.

## How to confirm before changing anything

1. Vercel → Deployments → function **logs/Duration** for `/dashboard` vs `/insights`. ~1–2s
   ⇒ server-side (auth+DB), confirming the above.
2. DevTools → Network → the document/RSC request: if **TTFB** dominates (not asset download),
   it's backend.
3. Compare Vercel function region vs Supabase region (item 3).
4. Optional: add `Server-Timing` or `console.time` around `getUser()` and the query batch to
   see the exact split.

## Recommended fix order

1. **Check Vercel↔Supabase region match** (user, free, possibly the whole problem).
2. **Dedupe auth to one network check per navigation** (`cache()` + `getClaims`) — files:
   `lib/auth/server.ts`, `lib/auth/middleware.ts`, `app/(app)/layout.tsx`, the `(app)` pages.
3. **Bump DB `max`** above 1 — `lib/db/client.ts`.
4. **Remove the duplicate `countDue`** — `app/(app)/layout.tsx` + `dashboard.service`.
5. Caching (item 5) + cold-start tuning (item 6) if still slow.

Items 2–4 are small, safe code changes (no UX change). Item 1 is a Vercel/Supabase dashboard
check. Suggest measuring (confirm step 1–2) before and after each change to attribute the win.

---

# Phase 8 — Settings & account (2026-06-10)

Goal: complete Phase 8 end-to-end (`docs/ROADMAP.md §8`). Per-task log, a unit test per
task, a final manual-check list, doc updates.

**Two upfront decisions (asked the user):**
1. **DB migration delivery** — Phase 8 needs a new `user_preferences` table. The user cannot
   run `pnpm db:push` (IPv6 issue reaching the pooler from their machine). **Resolution:** ship
   the migration as **copy-paste SQL for the Supabase SQL Editor** (`drizzle/0003_user_preferences.sql`),
   which goes over HTTPS and sidesteps the IPv6 problem. App read-path degrades gracefully to
   defaults if the table is absent, so deploying before the SQL is applied does not break the app.
2. **Anki `.apkg` (8.2b)** — **deferred** by user choice (needs native sqlite + zip deps and is
   only verifiable by manually opening in Anki). `/api/export?format=anki` returns `501
   not_implemented`; JSON + CSV shipped fully. Tracked below under "8.2b deferred".

## 8.2a Export — JSON + CSV  ✅

**What:** `GET /api/export?format=json|csv` streams a downloadable file of all the user's words
+ full SRS state.

**How:**
- `lib/db/queries/words.ts` → added `listForExport(userId)` (LEFT JOIN words×srs_state, SRS
  fields null when a word has no review yet) + `ExportRow` interface.
- `lib/services/export.service.ts` (new) — pure, DB-free formatters `toCSV`, `toJSON`, `csvCell`
  (RFC-4180 escaping: quote on comma/quote/newline, double embedded quotes). CSV columns:
  term, definition, examples (joined ` | `), source, added_at, ease_factor, interval_days,
  repetitions, due_date, last_reviewed_at. JSON is a versioned envelope
  `{version:1, exportedAt, count, words[]}`. Service fns `asJSON`/`asCSV` take an injectable
  `ExportDeps` (default = real query) so the row→string mapping is testable without a DB.
- `app/api/export/route.ts` (new) — auth 401, `force-dynamic`, sets `Content-Disposition`
  `attachment; filename=vocabmaxx-YYYY-MM-DD.{json,csv}`. `anki` → 501, unknown → 400.

**Round-trip count guarantee:** `asCSV` emits exactly one data line per source row (test asserts
`dataLines.length === rows.length`), satisfying the roadmap's "CSV → import → identical row count".

**Test:** `tests/unit/export.service.test.ts` — 15 cases (cell escaping, header, per-row count,
example join, comma escaping, empty SRS cells, trailing newline, JSON envelope/null-srs/round-trip,
injected-deps count match). **All 15 pass; full suite 132 pass.**

## 8.1a Settings — profile + theme  ✅

**What:** real Settings page (was `ComingSoon`) with an editable display name + email (read-only)
and a theme picker that persists to the account.

**How:**
- **New table `user_preferences`** (`lib/db/schema.ts`): `user_id` PK → `auth.users` (cascade),
  `display_name`, `theme` (default 'dark'), `daily_digest` (default false), `digest_hour`
  (default 14 UTC), timestamps. Migration `drizzle/0003_user_preferences.sql` is written as
  **idempotent copy-paste SQL for the Supabase SQL Editor** (avoids the IPv6 `db:push` failure),
  including RLS `owner_all` (auth.uid() = user_id).
- `lib/db/queries/preferences.ts` — `getByUser` (returns null, and **also null on Postgres
  42P01 "undefined table"** so the app degrades to defaults if the migration is not yet applied),
  `upsert` (insert … on conflict do update, bumps updated_at), `listDigestRecipients(hour)`.
- `lib/services/preferences.service.ts` — pure `applyDefaults` (fills defaults, clamps unknown
  theme → 'dark') + `normalizePatch` (blank display name → null), injectable `PreferencesDeps`,
  `get`/`update`.
- `lib/validation/preferences.schema.ts` — `preferencesPatchSchema` (theme enum, displayName ≤80,
  digestHour 0–23, ≥1 field required).
- `app/api/preferences/route.ts` — `GET` (current prefs) + `PATCH` (validate → update). 401/400.
- `components/settings/SettingsForm.tsx` — client; ProfileSection (display name save) +
  ThemeSection (radiogroup, drives `next-themes` immediately AND persists via PATCH, rolls back
  on failure). `app/(app)/settings/page.tsx` rewritten to load prefs server-side.

**Graceful-degradation note:** because the read path swallows 42P01, deploying this before the
SQL is applied shows default prefs and the theme toggle still works visually (next-themes);
saving will no-op-fail with a toast until the table exists.

**Test:** `tests/unit/preferences.service.test.ts` — 10 cases (defaults, theme clamp, null name,
patch normalisation/trim/clear, get-returns-defaults, update normalises+returns). **All pass;
suite 142 pass.**

## 8.1b Settings — notifications + danger zone  ✅

**What:** daily-digest opt-in (on/off + send-hour) and a typed-confirm "delete account" flow.

**How (notifications):** `NotificationsSection` in `SettingsForm.tsx` — a `role="switch"` toggle
(persists `dailyDigest`) and a UTC-hour `<select>` (persists `digestHour`, disabled when the
digest is off). Both PATCH `/api/preferences` and roll back optimistic state on failure. Backed
by the same `user_preferences` columns from 8.1a.

**How (danger zone / account deletion):**
- `lib/auth/admin.ts` — service-role Supabase client (`SUPABASE_SERVICE_ROLE_KEY`, no session
  persistence). Server-only.
- `lib/services/account.service.ts` — injectable `AccountDeps.deleteAuthUser`; real impl calls
  `admin.auth.admin.deleteUser(userId)`. Deleting the `auth.users` row **cascades** through
  words / srs_state / review_log / import_jobs / user_preferences via their FK `on delete
  cascade`, so there is no per-table cleanup. Returns `Result<…, {kind:'delete_failed'}>`.
- `app/api/account/route.ts` — `DELETE`: auth 401 → `deleteAccount` → 500 on failure; on success
  best-effort `supabase.auth.signOut()` to clear cookies, returns 200.
- `components/settings/DeleteAccountDialog.tsx` — base-ui Dialog; the destructive button is armed
  only when the user types `DELETE`. On success: client `signOut()` + redirect to `/auth/sign-in`.
  `DangerZone` card (destructive border) hosts it.

**Test:** `tests/unit/account.service.test.ts` — 2 cases (ok path passes userId through;
failure surfaces `delete_failed` + message). **All pass; suite 144 pass.**

**Manual-only acceptance:** the actual cascade delete + "re-sign-in fails" can only be verified
against a live Supabase (listed in the final manual checks).

## 8.3 Daily digest cron  ✅

**What:** a scheduled job that emails each opted-in user a digest of the words due for review.

**How:**
- `lib/services/email.service.ts` — pure `dailyDigestTemplate({count, sampleWords, displayName})`
  → `{subject, html, text}` (pluralised subject, name greeting, ≤5 sample words, "Review now"
  CTA). **`escapeHtml` applied to displayName + sample words** (a unit test caught an XSS hole
  where a raw `displayName` was interpolated into the HTML — fixed). `sendEmail`/`sendDailyDigest`
  use a lazily-constructed Resend client (`RESEND_API_KEY`, `EMAIL_FROM`).
- `lib/services/digest.service.ts` — `runDailyDigest(now, deps)` orchestrator with **injectable
  `DigestDeps`**: lists recipients for `now`'s UTC hour, and per user → count due → skip if 0 →
  resolve email (admin `getUserById`) → sample due terms → send. **Per-user failures are isolated
  and tallied** (`{considered, sent, skippedNoneDue, skippedNoEmail, failed}`), never aborting the
  batch.
- `lib/db/queries/preferences.ts` → `listDigestRecipients(hour)` (daily_digest = true at that hour).
- `app/api/cron/daily-digest/route.ts` — `Authorization: Bearer ${CRON_SECRET}` check (401 else),
  `maxDuration = 60`. Exposes **both GET (Vercel Cron's actual method) and POST** (the RUNBOOK §7.2
  manual curl) → same handler.
- `vercel.json` (new) — `crons: [{ path: '/api/cron/daily-digest', schedule: '0 14 * * *' }]`
  (14:00 UTC, per RUNBOOK §7).
- `.env.example` — added `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`.

**Test:** `tests/unit/digest.service.test.ts` — 10 cases: orchestrator (hour selection, send path,
skip-none-due, skip-no-email, per-user failure isolation, rejected-send→failed) + template
(pluralisation, name greeting, sample cap at 5, **html escaping**, no-sample line). **All pass.**

## 8.2b Anki `.apkg` export — DEFERRED (user decision)

Not built this session. `.apkg` is a zip of a SQLite `collection.anki2` DB; it needs runtime deps
(a sqlite writer + zip lib) and its only acceptance is manual ("opens in Anki desktop").
`GET /api/export?format=anki` returns **501 `not_implemented`** as a clean placeholder. JSON + CSV
ship fully (8.2a). To revive: add `better-sqlite3` + `fflate`, implement `asAnki(userId)` building
the Anki `col`/`notes`/`cards`/`models`(JSON) schema, set `serverExternalPackages: ['better-sqlite3']`
in `next.config.ts`, and verify by opening the file in Anki.

## Phase 8 verification run

- `pnpm test:unit` → **154 passing** (37 new across export/preferences/account/digest).
- `pnpm typecheck` → clean (fixed: base-ui Dialog uses controlled `open`, not `asChild`).
- `pnpm lint` → clean (only the pre-existing `middleware.test.ts` `any` warning).
- `pnpm build` → success; new routes `/settings`, `/api/preferences`, `/api/account`,
  `/api/export`, `/api/cron/daily-digest` all registered.
- `pnpm test:integ` → **not run** (no DB in sandbox — same standing limitation as prior phases).

## Phase 8 — manual checks to move to Phase 9

### ⚠️ Required setup (must do before features work in prod)
1. **Apply the DB migration.** Supabase Dashboard → **SQL Editor** → paste all of
   `drizzle/0003_user_preferences.sql` → **Run**. (This avoids the IPv6 `db:push` failure; the
   file is idempotent.) Until this runs, settings reads show defaults and saving fails with a toast.
2. **Set env vars** in Vercel (Production): `EMAIL_FROM` (a verified Resend sender),
   `NEXT_PUBLIC_APP_URL` (e.g. `https://vocabmaxx.com`). `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
   `CRON_SECRET` should already be set — confirm they are.
3. **Resend domain verification** must be complete before the digest sends from your domain.
4. **Vercel Cron**: `vercel.json` is committed; Vercel picks up the daily `0 14 * * *` schedule on
   the next production deploy (daily cadence works on Hobby). Confirm under Project → Cron Jobs.

### Functional checks (after setup)
- [ ] **Settings → Profile:** edit display name → Save → reload → it persists.
- [ ] **Settings → Theme:** toggle Light/Dark → reload → choice persists (stored on the account,
      not just localStorage). Verify a second device/incognito shows the saved theme after sign-in.
- [ ] **Export JSON:** `/api/export?format=json` (or a Settings/Export button) downloads
      `vocabmaxx-YYYY-MM-DD.json`; `count` === your word count.
- [ ] **Export CSV:** `/api/export?format=csv` downloads a CSV; open in Excel/Sheets → one row per
      word + header. (Round-trip: importing it back yields the same row count.)
- [ ] **Export Anki:** `/api/export?format=anki` → 501 (deferred, expected).
- [ ] **Notifications:** turn Daily digest On, pick an hour → reload → state persists.
- [ ] **Daily digest fire (manual):** set your `digest_hour` to the *current* UTC hour with at least
      one word due, then:
      `curl -X POST https://<app>/api/cron/daily-digest -H "Authorization: Bearer $CRON_SECRET"`
      → JSON shows `sent >= 1` and the email arrives. A wrong/absent bearer → 401.
- [ ] **Delete account (use a throwaway account):** Settings → Danger zone → Delete → type `DELETE`
      → confirm. Then verify: re-sign-in fails, and in Supabase the `words` / `srs_state` /
      `review_log` / `user_preferences` rows for that user id are gone (FK cascade).

### Known limitations
- Integration tests for the new queries (`preferences`, `listForExport`, digest recipients) are
  **not** in this session (no sandbox DB). Add them under `tests/integration/db/` when a test DB
  is available.
- 8.2b Anki export deferred (see above).
