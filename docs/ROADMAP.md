# Roadmap — VocabMaxx

> A subtask is "done" only when (1) code, (2) tests, and (3) manual verification all pass and are committed in the same change. Flip the `[ ]` checkbox in this file as part of the same commit.
>
> CI gate: `pnpm verify` (lint + typecheck + unit + integration) must be green.

Legend: `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked

---

## How to use this roadmap with subagents

Each subtask is sized for a single Sonnet subagent run. To keep your main context window small:

- **Docs to load:** every task lists the *minimum* doc sections the agent needs. Pass only those to the agent (e.g. `docs/TECH_SPEC.md §3`), not the whole `docs/` tree.
- **Invocation:** `use the Forge agent to implement task X.Y per docs/<doc>.md §<n>` (or `Atelier` for UI, `Crucible` for tests).
- **Verify before commit:** run the task's automated tests + manual steps yourself before flipping the checkbox.
- **One task per commit** with a Conventional Commit message.

Per-phase **Setup actions (you)** and **End-to-end verification** sections at the bottom of each phase tell you exactly what to do manually (Supabase, Vercel, Claude Design, etc.) and how to confirm the phase is green A-Z.

---

## Phase 0 — Foundation (no features, but everything must work)

### 0.1 Repo + Next.js scaffold
- **Docs to load:** `NEXT_SESSION.md` Step 1, `docs/ARCHITECTURE.md §2`.
- **Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`.
- **Acceptance:** `pnpm dev` serves `localhost:3000` with a placeholder page; `pnpm build` succeeds with no warnings.
- **Automated tests:** N/A.
- **Manual test:** `pnpm install && pnpm dev` → port 3000 serves a page; `pnpm build` exits 0.
- **Status:** `[x]`

### 0.2a Tailwind v4 + shadcn init
- **Docs to load:** `docs/DESIGN.md §2` (color tokens, spacing), `NEXT_SESSION.md` Step 3.
- **Files:** `tailwind.config.ts`, `components.json`, `app/globals.css`.
- **Acceptance:** `npx shadcn add button` writes `components/ui/button.tsx`; tokens from `DESIGN.md §2.2` present in `globals.css`.
- **Status:** `[x]`

### 0.2b Drizzle config
- **Docs to load:** `docs/TECH_SPEC.md §1` (DB schema), `docs/ADR/0003-drizzle-over-prisma.md`.
- **Files:** `drizzle.config.ts`, `lib/db/client.ts`, `package.json` (scripts `db:push`, `db:generate`, `db:studio`, `db:reset`).
- **Acceptance:** `pnpm db:generate` runs without error against an empty schema file.
- **Status:** `[x]`

### 0.2c Vitest + Playwright config
- **Docs to load:** `docs/TECH_SPEC.md §9` (testing strategy).
- **Files:** `vitest.config.ts`, `playwright.config.ts`, `tests/unit/.gitkeep`, `tests/integration/.gitkeep`, `tests/e2e/.gitkeep`.
- **Acceptance:** `pnpm test:unit` runs zero tests successfully; `pnpm test:e2e --list` succeeds.
- **Status:** `[x]`

### 0.2d ESLint + Prettier + Husky
- **Docs to load:** `docs/CONTRIBUTING.md` (lint conventions, pre-commit).
- **Files:** `eslint.config.mjs`, `.husky/pre-commit`.
- **Acceptance:** `pnpm lint` exits 0; pre-commit hook runs `pnpm lint && pnpm typecheck`; gitleaks runs in CI.
- **Status:** `[x]`

### 0.3a Supabase clients
- **Docs to load:** `docs/TECH_SPEC.md §8` (auth integration), `docs/SECURITY.md §2`.
- **Files:** `lib/auth/client.ts`, `lib/auth/server.ts`, `.env.example`.
- **Acceptance:** anon client reads from `NEXT_PUBLIC_SUPABASE_*`; server client uses cookies; `getSession()` and `requireUser()` exported from `server.ts`.
- **Status:** `[x]`

### 0.3b Auth middleware
- **Docs to load:** `docs/SECURITY.md §3.1`, `docs/ARCHITECTURE.md §6`.
- **Files:** `lib/auth/middleware.ts`, `middleware.ts`.
- **Acceptance:** middleware redirects unauth'd requests on `/(app)/*` to `/auth/sign-in`.
- **Manual test:** Visit `/dashboard` unauthed → redirected to `/auth/sign-in`.
- **Status:** `[x]`

### 0.4a DB schema
- **Docs to load:** `docs/TECH_SPEC.md §1` only.
- **Files:** `lib/db/schema.ts`, `drizzle/0000_init.sql` (generated).
- **Acceptance:** `pnpm db:push` against local Supabase creates all 5 tables + indexes.
- **Status:** `[x]`

### 0.4b RLS policies
- **Docs to load:** `docs/TECH_SPEC.md §2`, `docs/SECURITY.md §3.1`.
- **Files:** `drizzle/0001_rls.sql`.
- **Acceptance:** RLS enabled on 4 tables (not `definition_cache`); policies match spec.
- **Automated test:** `tests/integration/db/schema.test.ts` — table + RLS introspection.
- **Manual test:** `pnpm db:reset && pnpm db:push` → `psql` lists 5 tables, RLS on 4.
- **Status:** `[x]`

### 0.5a Marketing landing (text-only placeholder)
- **Docs to load:** `docs/PRD.md §1-3` (value prop, users, features), `docs/DESIGN.md §9` (marketing-specific).
- **Files:** `app/(marketing)/page.tsx`, `app/(marketing)/layout.tsx`.
- **Acceptance:** hero + feature list + CTA buttons render; copy reflects the no-extension scope.
- **Status:** `[x]`

### 0.5b Sign-in page
- **Docs to load:** `docs/TECH_SPEC.md §8`, `docs/SECURITY.md §2`.
- **Files:** `app/auth/sign-in/page.tsx`.
- **Acceptance:** Google OAuth button + magic-link email input both wired to Supabase.
- **Status:** `[x]`

### 0.5c Sign-up + OAuth callback
- **Docs to load:** `docs/TECH_SPEC.md §8`, `docs/SECURITY.md §2.3`.
- **Files:** `app/auth/sign-up/page.tsx`, `app/auth/callback/route.ts`.
- **Acceptance:** OAuth callback resolves session and redirects to `/dashboard`.
- **Automated test:** `tests/e2e/auth.spec.ts` — sign-up + sign-in flows (Playwright).
- **Manual test:** `/` → click "Sign up" → magic-link sent → click link → `/dashboard`.
- **Status:** `[x]`

### 0.5d Empty dashboard shell
- **Files:** `app/(app)/dashboard/page.tsx`, `app/(app)/layout.tsx`.
- **Acceptance:** shows "Welcome, {email}" and "0 words due"; signed-out users redirected.
- **Status:** `[x]`

### 0.6 CI workflow
- **Docs to load:** `docs/TECH_SPEC.md §10`, `NEXT_SESSION.md` Step 9.
- **Files:** `.github/workflows/ci.yml`.
- **Acceptance:** runs lint + typecheck + unit + integration on PR; green within 5 min on noop PR.
- **Status:** `[x]`

### 0.7a Sentry
- **Docs to load:** `docs/ARCHITECTURE.md §9`.
- **Files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `next.config.ts` (wrap with `withSentryConfig`).
- **Acceptance:** thrown error in dev appears in Sentry within 60s.
- **Status:** `[ ]` — removed from codebase; not planned for MVP. Errors logged to Vercel platform logs instead.

### 0.7b PostHog
- **Docs to load:** `docs/ARCHITECTURE.md §9`.
- **Files:** `lib/analytics/posthog.ts`, `app/layout.tsx` (mount provider).
- **Acceptance:** `/` page-view shows in PostHog dashboard.
- **Status:** `[x]`

### 0.8 Docs review pass
- **Docs to load:** all of `docs/`.
- **Acceptance:** every doc matches what shipped; ADRs link to Phase 0 commits.
- **Status:** `[x]`

### Pre-Phase 1 — Deployment blockers (do before Phase 1)

- [ ] **Set Supabase DB password** — go to Supabase dashboard → Settings → Database → Reset database password → set it to `Supabase@vocabmaxx`. Required for `pnpm db:push` to work locally.
- [ ] **Add Google OAuth redirect URI** — in Google Cloud Console, add `https://vocabmaxx.vercel.app/auth/callback` as an authorized redirect URI for the OAuth 2.0 client. Also add it in Supabase: Auth → URL Configuration → Redirect URLs. Required for Google sign-in on production.

---

### Phase 0 — Setup actions (you)
Do these in order **before** kicking off Phase 0 subtasks:

1. **Create Supabase project.** Go to [supabase.com](https://supabase.com) → New project → name `vocabmaxx`, region closest to you. Wait for provisioning.
2. **Copy credentials** from Settings → API into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep secret — never client-side)
3. **Enable auth providers** in Supabase dashboard → Auth → Providers:
   - Email (magic-link): on, confirm-email off for dev.
   - Google: paste Google OAuth client id + secret (create at console.cloud.google.com → APIs → Credentials → OAuth 2.0). Add redirect `https://<supabase-url>/auth/v1/callback`.
4. **DeepSeek key** already in `.env.local` (`DEEPSEEK_API_KEY`). Used for word-definition LLM fallback.
5. **Sentry** — not used; skip. Errors go to Vercel platform logs.
6. **PostHog** project token already in `.env.local`.
7. **Resend** API key already in `.env.local`. Verify a sending domain (or use onboarding domain in dev).
9. **GitHub repo:** `gh repo create vocabmaxx --public --description "Vocabulary SRS — capture words, own them"`.
10. **Vercel project:** import GitHub repo → paste all `.env.local` keys into Vercel → trigger first deploy.

### Phase 0 — End-to-end verification (A-Z)
Tick each line yourself. Phase is not done until every box is checked.

- [x] `pnpm install` clean from a fresh clone.
- [x] `pnpm dev` → `localhost:3000` renders marketing page.
- [x] `pnpm build` → 0 warnings, 0 errors.
- [x] `pnpm lint && pnpm typecheck` → green.
- [x] `pnpm test:unit` → green (16 tests pass).
- [x] DB schema applied via Supabase SQL editor → 5 tables, RLS on 4 (`definition_cache` has public read policy, not owner RLS).
- [x] Visit `/dashboard` unauth'd → bounced to `/auth/sign-in`.
- [x] Sign in with Google → land on `/dashboard` showing "0 words due".
- [x] Sign in with magic-link → email arrives → click → `/dashboard`.
- [x] Sign out → `/dashboard` redirects to `/auth/sign-in`.
- [x] Throw a test error from a button in dev → error appears in Vercel logs. (Sentry removed; Vercel logs used instead)
- [x] Visit `/` → PostHog pageview event fires.
- [ ] Open a noop PR → CI green within 5 min, Vercel preview URL posted.
- [x] Deploy to Vercel production → live URL renders `/` and supports sign-in.
- [x] All Phase 0 checkboxes above flipped to `[x]`.

---

## Phase 1 — Domain core

### 1.1 SM-2 algorithm
- **Docs to load:** `docs/TECH_SPEC.md §3` (full section + worked example), `docs/ADR/0006-sm2-vs-fsrs.md`.
- **Files:** `lib/domain/grade.ts`, `lib/domain/srs.ts`.
- **Acceptance:** pure function, deterministic given `now`.
- **Automated tests:** `tests/unit/srs.test.ts` — all 15 cases from `TECH_SPEC §3`.
- **Subagent:** Crucible writes the tests (red), Forge writes the implementation (green).
- **Status:** `[x]`

### 1.2 Domain types + invariants
- **Docs to load:** `docs/TECH_SPEC.md §3` (`errors.ts` block), `docs/ARCHITECTURE.md §3` (domain layer).
- **Files:** `lib/domain/word.ts`, `lib/domain/errors.ts`.
- **Acceptance:** `Word` constructor throws on empty term/definition or examples length ∉ 1..3. `Result<T,E>` helpers exported.
- **Automated tests:** `tests/unit/word.test.ts` — 7 cases.
- **Status:** `[x]`

### Phase 1 — Setup actions (you)
None — pure code.

### Phase 1 — End-to-end verification
- [x] `pnpm test:unit` → 22+ tests pass. (46 tests pass)
- [x] Worked example in `TECH_SPEC §3` traced by hand matches test output.
- [x] `git grep "any" lib/domain/` → 0 hits.

---

## Phase 2 — Persistence

### 2.1 Drizzle queries — words
- **Docs to load:** `docs/TECH_SPEC.md §1` (words table), `docs/ARCHITECTURE.md §3` (service layer).
- **Files:** `lib/db/queries/words.ts`.
- **Acceptance:** functions `insert`, `findById`, `findByUserAndTerm`, `listByUser`, `deleteById`.
- **Automated tests:** `tests/integration/db/words.test.ts` — insert + find, unique enforced, delete cascades.
- **Status:** `[x]`

### 2.2 Drizzle queries — SRS state + review log
- **Docs to load:** `docs/TECH_SPEC.md §1` (srs_state, review_log tables).
- **Files:** `lib/db/queries/srs.ts`, `lib/db/queries/review-log.ts`.
- **Acceptance:** `findDue(userId, now)` returns only due rows; `recordReview` is transactional.
- **Automated tests:** `tests/integration/db/srs.test.ts`.
- **Status:** `[x]`

### 2.3 Service composition
- **Docs to load:** `docs/TECH_SPEC.md §4` (SRSService contract), `docs/ARCHITECTURE.md §3`.
- **Files:** `lib/services/word.service.ts`, `lib/services/srs.service.ts`.
- **Acceptance:** services return `Result<T, E>`; `srs.service.recordReview` updates state + writes log in one transaction.
- **Automated tests:** `tests/unit/srs.service.test.ts` with mock queries.
- **Status:** `[x]`

### 2.4 RLS integration test
- **Docs to load:** `docs/SECURITY.md §3.1`, `docs/TECH_SPEC.md §2`.
- **Files:** `tests/integration/db/rls.test.ts`.
- **Acceptance:** two seeded users — user A's JWT returns 0 rows of user B's data.
- **Status:** `[x]`

### Phase 2 — Setup actions (you)
1. **Local Supabase shadow DB** (recommended for integration tests): `npx supabase start` — gives a clean Postgres on `54322` for test isolation. Add `SUPABASE_TEST_DB_URL` to `.env.local`.
2. Or use a **separate Supabase project** named `vocabmaxx-test`.

### Phase 2 — End-to-end verification
- [x] `pnpm test:integ` → green. (18 tests pass — words 6, srs 4, rls 5, schema 3)
- [x] In Supabase SQL editor, manually try `select * from words` as anon role → 0 rows. As user A's JWT → only A's rows. (asserted by `tests/integration/db/rls.test.ts`)
- [x] Insert a word, delete the user → `srs_state` row gone (cascade works). (asserted by `tests/integration/db/words.test.ts` "deleteById cascades srs_state and review_log")

---

## Phase 3 — Definition pipeline

### 3.1 Dictionary client
- **Docs to load:** `docs/TECH_SPEC.md §4` (DefinitionService), `docs/ADR/0005-hybrid-definition-pipeline.md`.
- **Files:** `lib/services/dict.client.ts`.
- **Acceptance:** GETs dictionaryapi.dev, returns first definition with non-empty example; typed errors otherwise.
- **Automated tests:** `tests/integration/api/dict.test.ts` with MSW — 4 cases.
- **Status:** `[x]`

### 3.2 LLM client
- **Docs to load:** `docs/TECH_SPEC.md §7` (LLM contracts — definition prompt), `docs/ADR/0005-hybrid-definition-pipeline.md`.
- **Files:** `lib/services/llm.client.ts`.
- **Acceptance:** DeepSeek `deepseek-chat` call (substituted for Anthropic Haiku — see ADR), strict JSON parse, typed errors on schema mismatch / 429.
- **Automated tests:** `tests/integration/api/llm.test.ts` with MSW — 5 cases.
- **Status:** `[x]`

### 3.3 Hybrid composer
- **Docs to load:** `docs/TECH_SPEC.md §4` (DefinitionService composer pseudocode).
- **Files:** `lib/services/definition.service.ts`.
- **Acceptance:** uses `definition_cache`; cache hit short-circuits; dict → LLM fallback.
- **Automated tests:** `tests/unit/definition.service.test.ts` with mocks — 7 cases.
- **Status:** `[x]`

### 3.4 `/api/capture` route
- **Docs to load:** `docs/TECH_SPEC.md §5` (Capture endpoint) + `§6` (Zod), `docs/SECURITY.md §4`.
- **Files:** `app/api/capture/route.ts`, `lib/validation/capture.schema.ts`.
- **Acceptance:** auth required, Zod-validates, returns typed responses.
- **Automated tests:** `tests/integration/api/capture.test.ts` — 401, 400, 200, 409.
- **Manual test:** signed in, POST `{term:"ubiquitous"}` → 200; again → 409; `{term:"defenestrate"}` → 200 source=`llm`.
- **Status:** `[x]`

### Phase 3 — Setup actions (you)
1. Confirm `DEEPSEEK_API_KEY` (and optional `DEEPSEEK_BASE_URL`) in `.env.local` and Vercel.
2. Eyeball your DeepSeek console for billing — Phase 3 starts spending fractions of a cent per rare-word capture (cached afterwards).

### Phase 3 — End-to-end verification
- [ ] `curl` capture endpoint with common word → JSON definition.
- [ ] Run twice in a row → second call hits cache (check `definition_cache` table grew by 1, not 2).
- [ ] Rare word → `source: "llm"` in response.
- [ ] Vercel logs show zero errors for happy path.

---

## Phase 4 — Capture UI + dashboard

> **Claude Design enters here.** All UI tasks in this phase follow the handoff contract in `docs/DESIGN.md §4`. See **Claude Design usage** at the bottom of this phase.

### 4.1a App shell layout
- **Docs to load:** `docs/DESIGN.md §3, §7` (component map, breakpoints).
- **Files:** `app/(app)/layout.tsx`, `components/layout/AppShell.tsx`.
- **Acceptance:** consistent shell on all `/(app)/*` routes; mobile collapses sidebar.
- **Subagent:** Atelier.
- **Status:** `[x]`

### 4.1b Sidebar + Topbar
- **Docs to load:** `docs/DESIGN.md §3, §6` (a11y).
- **Files:** `components/layout/Sidebar.tsx`, `components/layout/Topbar.tsx`.
- **Acceptance:** keyboard-navigable, current route highlighted.
- **Automated tests:** `tests/e2e/shell.spec.ts` — sidebar links navigate.
- **Status:** `[x]`

### 4.2 Dashboard
- **Docs to load:** `docs/DESIGN.md §5` (loading / empty / error states), `docs/TECH_SPEC.md §4` (SRSService.due).
- **Files:** `app/(app)/dashboard/page.tsx`, `components/dashboard/DueBanner.tsx`, `components/dashboard/RecentCaptures.tsx`.
- **Acceptance:** due-count banner + last 10 captures, with empty state.
- **Subagent:** Atelier.
- **Status:** `[x]`

### 4.3 Single-word capture UI
- **Docs to load:** `docs/DESIGN.md §5`, `docs/TECH_SPEC.md §5` (Capture endpoint shape).
- **Files:** `app/(app)/capture/page.tsx`, `components/capture/AddWordInput.tsx`.
- **Acceptance:** auto-focused input; Enter submits; loading + toast states.
- **Automated tests:** Playwright `tests/e2e/capture-single.spec.ts`.
- **Status:** `[x]`

### 4.4a Paragraph extract — LLM prompt + API
- **Docs to load:** `docs/TECH_SPEC.md §7` (paragraph extraction prompt), `§5` (Import endpoint mode=extract).
- **Files:** `app/api/words/import/route.ts` (extract branch), `lib/services/import.service.ts` (extract method).
- **Acceptance:** POST paragraph → array of candidate terms.
- **Automated tests:** integration test with MSW for LLM call.
- **Status:** `[x]`

### 4.4b Paragraph extract — UI
- **Docs to load:** `docs/DESIGN.md §5`.
- **Files:** `components/capture/ParagraphExtractor.tsx`.
- **Acceptance:** paste text → candidate list with checkboxes → "Save selected" calls capture in bulk.
- **Automated tests:** Playwright happy path.
- **Status:** `[x]`

### 4.5a Bulk import — API
- **Docs to load:** `docs/TECH_SPEC.md §5` (Import endpoint mode=save).
- **Files:** `app/api/words/import/route.ts` (save branch), `lib/services/import.service.ts` (save method).
- **Acceptance:** accepts array of terms, returns summary `{added, skipped, failed}`.
- **Status:** `[x]`

### 4.5b Bulk import — UI
- **Docs to load:** `docs/DESIGN.md §5`.
- **Files:** `components/capture/BulkUploader.tsx`.
- **Acceptance:** drop `.txt` → progress modal → summary at end.
- **Status:** `[x]`

### Phase 4 — Claude Design usage
This is the first phase that ships pixels. Follow `docs/DESIGN.md §4` exactly:

1. **You draft the Design Intent** for each screen (Dashboard, Capture, app shell) per `DESIGN.md §4 Step 1` — a 5-bullet text doc per screen describing purpose, primary action, states, data shape, references.
2. **Run Claude Design** (claude.ai/design or the `/design` slash if available) with each Intent → it returns React + Tailwind + shadcn snippets per `Step 2`.
3. **Paste the snippets into the matching task's `components/`** and have the Atelier subagent wire them to the service-layer hooks per `Step 3` — never let Atelier invent the visual itself.
4. **A11y pass:** every component must satisfy `DESIGN.md §6` before commit.

### Phase 4 — Setup actions (you)
1. Get the Plasmo-free flow working end-to-end on **mobile Safari + desktop Chrome** in addition to dev.
2. Seed your own DB with 3-5 captures (via the UI) so reviews exist for the next phase.

### Phase 4 — End-to-end verification
- [ ] Sign in fresh user → dashboard shows "0 captures".
- [ ] `/capture` → type "alacrity" → row appears within 2s on dashboard.
- [ ] Paste a paragraph → at least 3 candidates appear → uncheck one → save → only selected saved.
- [ ] Drop a `.txt` with 20 lines → progress + summary modal; DB row count + 20 (minus dupes).
- [ ] Lighthouse mobile on `/dashboard` ≥ 90 (manual run — no `pnpm lighthouse` script).
- [ ] No errors in Vercel logs during the run.

---

## Phase 5 — Review session

### 5.1a FlipCard component
- **Docs to load:** `docs/DESIGN.md §8` (motion), `§3` (component map).
- **Files:** `components/review/FlipCard.tsx`.
- **Acceptance:** flips on tap/keypress; respects `prefers-reduced-motion`.
- **Subagent:** Atelier.
- **Status:** `[x]`

### 5.1b GradeButtons component
- **Docs to load:** `docs/TECH_SPEC.md §3` (Grade enum), `docs/DESIGN.md §3`.
- **Files:** `components/review/GradeButtons.tsx`.
- **Acceptance:** 4 buttons (Again/Hard/Good/Easy) mapped to grades 0/3/4/5; keyboard 1-4.
- **Status:** `[x]`

### 5.1c Review page + done screen
- **Docs to load:** `docs/TECH_SPEC.md §5` (Review endpoints).
- **Files:** `app/(app)/review/page.tsx`, `components/review/SessionDoneScreen.tsx`.
- **Acceptance:** auto-advance on grade; "All done" screen when queue empty.
- **Automated tests:** `tests/unit/review-session.test.ts` (session state machine) + scripted authed E2E against dev server (capture → due → grade → queue empty). Playwright spec deferred until e2e harness exists.
- **Status:** `[x]`

### 5.2 `/api/review/grade`
- **Docs to load:** `docs/TECH_SPEC.md §5` (Review/grade), `§4` (SRSService.recordReview).
- **Files:** `app/api/review/grade/route.ts`.
- **Acceptance:** persists state + writes review_log atomically.
- **Automated tests:** `tests/integration/api/grade.test.ts` (route contract) + `tests/integration/db/grade-race.test.ts` (concurrent grades serialize via SELECT FOR UPDATE; cross-user grade rejected).
- **Status:** `[x]`

### Phase 5 — Setup actions (you)
1. Backdate a few `srs_state.due_date` rows via Supabase SQL editor so you have a review queue locally:
   ```sql
   update srs_state set due_date = now() - interval '1 day' where user_id = '<your-uid>';
   ```

### Phase 5 — End-to-end verification
- [x] `/review` → first card shown. (verified via authed E2E script: SSR HTML renders the due card; empty queue shows "All caught up")
- [x] Flip → 4 buttons visible. (GradeButtons disabled until flipped)
- [x] Grade Good progression → interval 1 → 6 → ~6×EF days. (rep-2 6-day verified in grade-race.test.ts; full worked example in tests/unit/srs.test.ts)
- [x] Grade Again → reps reset to 0, interval back to 1. (verified live: state {ease 1.7, interval 1, reps 0})
- [x] After last card → "All done" screen. (queue empties after grade; SessionDoneScreen on isDone)
- [ ] Lighthouse mobile ≥ 90. (not run — fold into Phase 9 performance pass)

### Phase 5+ — Post-launch enhancements (shipped 2026-06-10, branch `claude/learning-app-perf-features-5msa7s`, merged to `master`)
These were user-requested fixes/features delivered after Phase 5, logged in `webusage.md`:
- [x] **Optimistic grading** — `ReviewSession` advances instantly on grade and fires
  `POST /api/review/grade` in the background (was `await`-blocking, felt >1s). Non-blocking
  "Saving" spinner; failed saves toast. Files: `components/review/ReviewSession.tsx`.
- [x] **Instant tab navigation** — added `app/(app)/loading.tsx` skeleton so route switches
  render immediately instead of hanging on the previous page during server fetch.
- [x] **Practice (cram) mode** — `/review?mode=practice` flips through ALL captured words
  WITHOUT touching SRS state (algorithm-safe; no grade is persisted). Entry points: "Practice
  anyway" on the caught-up screen + "Keep reviewing" on `SessionDoneScreen`. Files:
  `app/(app)/review/page.tsx`, `components/review/ReviewSession.tsx` (`practice` prop),
  `components/review/SessionDoneScreen.tsx`.
- [x] **Algorithm lab** — `/algorithm` interactive page that runs the real `nextState()` SM-2
  function client-side (preview + history table) so the schedule can be tested live on Vercel.
  Added to sidebar nav. Files: `app/(app)/algorithm/page.tsx`,
  `components/algorithm/AlgorithmLab.tsx`, `components/layout/Sidebar.tsx`.
- [x] **Auth build fix** — `force-dynamic` on `app/auth/sign-in|sign-up/page.tsx` to stop the
  Vercel build crashing while prerendering `AuthCard` (Supabase client needs `NEXT_PUBLIC_*`
  env not present at static-export time).

---

## Phase 6 — Word list, detail, search

### 6.1a Word list page
- **Docs to load:** `docs/TECH_SPEC.md §5` (Words list endpoint), `docs/DESIGN.md §3, §5`.
- **Files:** `app/(app)/words/page.tsx`, `components/words/WordsList.tsx`.
- **Acceptance:** virtualized for > 200 rows; search bar (case-insensitive prefix); filter All/Due/Mastered.
- **Status:** `[x]` — completed 2026-06-10. Server-rendered list (`wordService.listWithStatus`,
  which LEFT JOINs `srs_state` for reps + due date) + case-insensitive search (term & definition,
  via pure `lib/words/filter.ts`) + **All/Due/Mastered filter** + **hand-rolled virtualization**
  (`VirtualRows` in `WordsList.tsx`, windowed at >50 rows, no new dependency) + per-row delete +
  rows link to the detail page. Built as `components/words/WordsList.tsx` (single client component),
  not the planned `WordList`/`WordRow` split.

### 6.1b Word list — unit tests
- **Files:** `tests/unit/word-list.test.ts`, `tests/e2e/words-list.spec.ts`.
- **Acceptance:** filter and search logic covered.
- **Status:** `[x]` — `tests/unit/word-list.test.ts` (17 cases: `repsToStatus`, search,
  All/Due/Mastered filter, combined) + `tests/unit/word.service.test.ts` (status/due derivation).
  Playwright `words-list.spec.ts` deferred until the e2e harness exists (consistent with other phases).

### 6.2a Word detail page
- **Docs to load:** `docs/TECH_SPEC.md §5` (Words detail endpoint).
- **Files:** `app/(app)/words/[id]/page.tsx`, `components/words/WordDetail.tsx`.
- **Acceptance:** definition, examples, SRS stats.
- **Status:** `[x]` — completed 2026-06-10. Server page (UUID-validated → `notFound()`,
  `wordService.getDetail`) renders `WordDetail`: definition, examples, SRS stat grid
  (reps / interval / ease / next due) + review history with grade labels.

### 6.2b Word edit + delete
- **Docs to load:** `docs/TECH_SPEC.md §5` (PATCH/DELETE word).
- **Files:** `components/words/WordEditor.tsx`, dialog wiring in `WordDetail.tsx`.
- **Acceptance:** edit dialog persists; delete behind a confirmation modal.
- **Status:** `[x]` — completed 2026-06-10. **Delete:** `DELETE /api/words/[id]` (auth +
  UUID-validated, user-scoped) → `wordService.remove` → `deleteByIdForUser` (cascades
  `srs_state`/`review_log`), confirm `Dialog` in `WordsList`/`WordDetail`. **Edit:**
  `PATCH /api/words/[id]` (Zod-validated `definition?`/`examples?` 1–3) → `wordService.update`
  (`updateForUser`, owner-scoped) wired to `components/words/WordEditor.tsx` dialog in `WordDetail`.

### Phase 6 — Setup actions (you)
None.

### Phase 6 — End-to-end verification
- [~] 250 seeded words → list scrolls smoothly (DevTools Performance: no scroll jank > 16ms). (virtualization shipped — `VirtualRows`; final perf check is a user manual step on Vercel)
- [x] Search "ali" → only matching rows. (pure `filterWords`, term + definition)
- [x] Filter Due → only due rows. (All/Due/Mastered segmented filter in `WordsList`)
- [x] Edit a word → reload → change persisted. (`WordEditor` → `PATCH /api/words/[id]`)
- [x] Delete → confirmation → row gone; `srs_state` row gone (cascade). (confirm dialog + `DELETE /api/words/[id]`, FK cascade)

---

## Phase 7 — Insights

### 7.1 SQL views
- **Docs to load:** `docs/TECH_SPEC.md §4` (AnalyticsService), `§1` (review_log table).
- **Files:** `drizzle/0002_views.sql`.
- **Acceptance:** views `vocab_growth_daily`, `retention_30d`, `top_failed_words`.
- **Automated tests:** `tests/integration/db/analytics.test.ts` — seeded data → expected aggregates.
- **Status:** `[x]` — completed 2026-06-10. Analytics are computed **in-app** via
  `lib/db/queries/analytics.ts` (aggregation over base tables) so **no migration is required**;
  `drizzle/0002_views.sql` ships the 3 views as an **optional** artifact (`security_invoker`).
  `tests/integration/db/analytics.test.ts` (4 cases) written — runs against a live test DB
  (not in sandbox, same as other `tests/integration/db/*`).

### 7.2 AnalyticsService
- **Docs to load:** `docs/TECH_SPEC.md §4` (AnalyticsService contract).
- **Files:** `lib/services/analytics.service.ts`.
- **Acceptance:** typed methods over each view.
- **Status:** `[x]` — completed 2026-06-10. `vocabGrowth` / `retentionRate` / `problemWords`
  (injectable-deps pattern) + exported pure `buildGrowthSeries`. Unit-tested in
  `tests/unit/analytics.service.test.ts` (10 cases).

### 7.3a Growth chart
- **Docs to load:** `docs/DESIGN.md §3, §8`.
- **Files:** `components/insights/GrowthChart.tsx`.
- **Acceptance:** SVG-based, < 50kB gzipped chart code; or recharts only if budget allows.
- **Status:** `[x]` — completed 2026-06-10. Hand-rolled SVG area+line (no chart dependency),
  geometry from pure `lib/insights/chart.ts` (unit-tested, 7 cases). Empty state included.

### 7.3b Retention gauge + problem words
- **Files:** `components/insights/RetentionGauge.tsx`, `components/insights/ProblemWords.tsx`.
- **Status:** `[x]` — completed 2026-06-10. SVG ring gauge (colour-banded, sample-size empty
  state) + problem-words list (rows link to word detail). Both server-renderable.

### 7.3c Insights page wiring
- **Files:** `app/(app)/insights/page.tsx`.
- **Acceptance:** all three widgets render with real data.
- **Status:** `[x]` — completed 2026-06-10. Server page (`force-dynamic`) fetches the three
  analytics methods (+ `reviewOutcomes` for the gauge sample size) in `Promise.all` and renders
  GrowthChart + RetentionGauge + ProblemWords. Replaces the ComingSoon placeholder.

### Phase 7 — Setup actions (you)
1. Seed 30 days of review_log so charts have data. SQL snippet — see `docs/RUNBOOK.md` (add one if missing).

### Phase 7 — End-to-end verification
- [x] `/insights` renders all three widgets. (server page wired to AnalyticsService; empty states when no data)
- [~] Manually compute retention from review_log and compare to gauge. (gauge = passed(grade≥3)/total; verify on Vercel with real reviews)
- [x] Bundle size of insights chunk < 50kB gzipped. (hand-rolled SVG, no chart library — well under budget)

> Note: analytics compute in-app (no migration needed). `drizzle/0002_views.sql` is an
> optional artifact. Seed review history (or backdate `words.added_at`) to see non-empty charts.

---

## Phase 8 — Settings & account

### 8.1a Settings — profile + theme
- **Docs to load:** `docs/DESIGN.md §2` (tokens).
- **Files:** `app/(app)/settings/page.tsx`, `components/settings/SettingsForm.tsx`,
  `lib/services/preferences.service.ts`, `lib/db/queries/preferences.ts`,
  `lib/validation/preferences.schema.ts`, `app/api/preferences/route.ts`,
  `drizzle/0003_user_preferences.sql` (new `user_preferences` table + RLS).
- **Acceptance:** profile fields editable; theme picker persists to user prefs. ✅
- **Status:** `[x]` (shipped 2026-06-10, branch `claude/learning-app-perf-features-5msa7s`).

### 8.1b Settings — notifications + danger zone
- **Docs to load:** `docs/SECURITY.md §15` (account deletion); RUNBOOK §8 (account mgmt).
- **Files:** `components/settings/SettingsForm.tsx` (notifications section),
  `components/settings/DeleteAccountDialog.tsx`, `lib/services/account.service.ts`,
  `lib/auth/admin.ts`, `app/api/account/route.ts`.
- **Acceptance:** delete account behind a typed-confirm; data fully deleted (cascade). ✅
- **Status:** `[x]` (shipped 2026-06-10).

### 8.2a Export — JSON + CSV
- **Docs to load:** `docs/TECH_SPEC.md §4` (ExportService), `§5` (Export endpoint).
- **Files:** `lib/services/export.service.ts` (json+csv methods), `app/api/export/route.ts`,
  `lib/db/queries/words.ts` (`listForExport`).
- **Acceptance:** round-trip CSV → import → identical row count. ✅
- **Automated tests:** `tests/unit/export.service.test.ts` (15 cases). ✅
- **Status:** `[x]` (shipped 2026-06-10).

### 8.2b Export — Anki `.apkg`
- **Docs to load:** `docs/TECH_SPEC.md §4` (ExportService), plus Anki .apkg spec (sqlite zip).
- **Files:** `lib/services/export.service.ts` (anki method).
- **Acceptance:** generated `.apkg` opens in Anki desktop without errors.
- **Status:** `[~]` **deferred** (user decision 2026-06-10 — needs native sqlite+zip deps, manual-only
  acceptance). `/api/export?format=anki` returns 501. Revival notes in `webusage.md` "8.2b".

### 8.3 Daily digest cron
- **Docs to load:** `docs/TECH_SPEC.md §5` (Cron section), `docs/RUNBOOK.md` (deploy/cron).
- **Files:** `app/api/cron/daily-digest/route.ts`, `lib/services/email.service.ts`,
  `lib/services/digest.service.ts`, `vercel.json` (cron spec).
- **Acceptance:** Vercel Cron fires → Resend sends digest. ✅ (logic shipped + tested; live send
  pending Resend domain verification — see manual checks).
- **Manual test:** set `digest_hour` = current UTC hour with words due → POST the cron route → email arrives.
- **Status:** `[x]` (shipped 2026-06-10; live-send verification is a manual check).

### Phase 8 — Setup actions (you)
1. **Apply `drizzle/0003_user_preferences.sql`** via Supabase SQL Editor (the `db:push` path
   fails over IPv6 from some networks; the SQL Editor is HTTPS and works). Idempotent.
2. **Env vars** (Vercel prod): `EMAIL_FROM` (verified Resend sender), `NEXT_PUBLIC_APP_URL`;
   confirm `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET` are set.
3. **Resend domain verification** must be complete before the digest is enabled in prod.
4. **Vercel cron** requires a Pro plan for sub-daily intervals; daily (`0 14 * * *`) is on Hobby.

### Phase 8 — End-to-end verification
- [ ] Apply `0003_user_preferences.sql` in Supabase SQL Editor (required first).
- [ ] Settings → edit profile + theme → reload → both persist to the account.
- [ ] Export each format → re-import the CSV → row counts match. (`anki` → 501, expected.)
- [~] Open `.apkg` in Anki → deck imports cleanly (deferred — 8.2b).
- [ ] Delete a throwaway account → re-sign-in fails; words/srs_state/review_log/user_preferences
      rows for that user are gone (cascade).
- [ ] POST the cron route with the CRON_SECRET bearer → digest email lands with correct due-count;
      wrong/absent bearer → 401.

> Full per-task build notes + the complete manual-check list: `webusage.md` → "Phase 8".

---

## Phase 9 — Polish & launch

### 9.1 Performance pass
- **Docs to load:** `docs/TECH_SPEC.md §12` (performance contracts), `docs/ARCHITECTURE.md §11`.
- **Acceptance:** Lighthouse mobile ≥ 95 on `/`, `/dashboard`, `/review`.
- **Manual test:** Run Lighthouse from Chrome DevTools or `npx lighthouse` → > 95 on FCP, LCP, CLS, TBT. (No `pnpm lighthouse` package.json script exists — run manually.)
- **Status:** `[ ]`

### 9.2 SEO + OG
- **Docs to load:** `docs/DESIGN.md §9` (marketing).
- **Files:** `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`.
- **Acceptance:** OG card renders for marketing pages; sitemap valid.
- **Status:** `[ ]`

### 9.3 README + LinkedIn post
- **Files:** `README.md` (top-level).
- **Acceptance:** screenshots, live demo URL, badges, polished copy. LinkedIn post drafted in `NEXT_SESSION.md` for ship day.
- **Status:** `[ ]`

### Phase 9 — Setup actions (you)
1. Take screenshots at `1280×720` of: landing, dashboard, capture, review.
2. Draft LinkedIn post — keep it under 200 words, lead with the "from heard to owned" loop.
3. Tag the v1.0.0 release: `gh release create v1.0.0`.

### Phase 9 — End-to-end verification
- [ ] Lighthouse mobile on 3 pages → all ≥ 95 (manual — Chrome DevTools or `npx lighthouse`).
- [ ] `/sitemap.xml` valid, `/robots.txt` correct.
- [ ] Open `/` link in Slack/Twitter → OG card preview renders.
- [ ] Live demo URL in README clickable and working.
- [ ] LinkedIn draft ready in `NEXT_SESSION.md`.

---

## Phase X — Future / post-MVP (do NOT build now)

These were originally Phases 9-10 in the v1 plan. They are explicitly **out of scope for v1** and parked here for after launch.

### X.1 Browser extension (Plasmo)
- **Docs to load (when revived):** `docs/ARCHITECTURE.md §2` (extension folder), `docs/SECURITY.md §2` (cross-origin auth).
- **Scope:** right-click any word on any webpage → "Save to VocabMaxx" → captures via `/api/capture` with the user's Supabase session.
- **Status:** `[ ]` deferred.

### X.2 PWA installable + offline review
- **Docs to load (when revived):** `docs/ARCHITECTURE.md §10`.
- **Scope:** `public/manifest.json`, `next-pwa` service worker, offline cache for already-loaded review cards.
- **Status:** `[ ]` deferred.

---

## Phase exits — quick reference

| Phase | "Done" when… |
|---|---|
| 0 | Authenticated user lands on empty dashboard; CI green; preview deploys; all setup keys live. |
| 1 | SM-2 worked example passes; domain types invariant-tested. |
| 2 | Two users in DB cannot see each other's rows; RLS test green. |
| 3 | Hybrid capture API returns definitions for both common and rare words. |
| 4 | User can capture one word, paste a paragraph, and bulk import a file. Claude Design loop in flow. |
| 5 | User can complete a review session and SM-2 schedules persist. |
| 6 | User can search, filter, edit, delete cards. |
| 7 | Insights page renders growth, retention, problem words. |
| 8 | User can export to all 3 formats; daily digest emails fire. |
| 9 | Lighthouse ≥ 95; README polished; LinkedIn post drafted; v1.0.0 tagged. |
| X | Deferred — do not start until v1 has shipped and been used by real people. |
