# VocabMaxx — Session Handoff

**Read this first. This is the complete context for the next session.**

---

## State as of 2026-06-09

### What's done

| Area | Status |
|---|---|
| Docs (PRD, ARCHITECTURE, TECH_SPEC, ROADMAP, ADRs, etc.) | ✅ Complete |
| Next.js 15 + TypeScript + Tailwind v4 scaffold | ✅ |
| Supabase Auth stubs (client, server, middleware) | ✅ |
| Drizzle ORM schema (5 tables) | ✅ |
| SM-2 domain layer | ✅ |
| Unit tests (10/10 passing) | ✅ |
| Marketing landing page + dashboard shell | ✅ |
| Sign-in + sign-up pages (magic-link + Google, both `signInWithOtp`) | ✅ |
| `app/(app)/layout.tsx` with `requireUser()` server guard | ✅ |
| `pnpm build` — passes (Tailwind v4 / PostCSS fixed) | ✅ |
| OAuth callback handler | ✅ |
| Sentry + PostHog stubs | ✅ |
| Zod validation schemas | ✅ |
| CI workflow (Node 22, pnpm 11, lint+typecheck+test:unit) | ✅ pushed, should be green |
| Git repo `github.com/lesaathvik24/vocabmaxx` | ✅ |

### What's NOT done yet

- DB schema not applied — see instructions below
- Google sign-in — configured in Supabase but not tested end-to-end
- Vercel deploy — not done
- Phase 1+ features (capture, review, words, insights) — not started

---

## Credentials & config (all in `.env.local`)

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qbogwjfneuswzwdykoxf.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | in `.env.local` |
| `DEEPSEEK_API_KEY` | in `.env.local` (replaces Anthropic) |
| `GOOGLE_CLIENT_ID` | in `.env.local` |
| `GOOGLE_CLIENT_SECRET` | in `.env.local` |
| `NEXT_PUBLIC_SENTRY_DSN` | in `.env.local` |
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_CBimfsjwVj24kjoiF86td9bqwdAESfj5NnA2TUFvuKjj` |
| `RESEND_API_KEY` | in `.env.local` |
| `DB_HOST` | `db.qbogwjfneuswzwdykoxf.supabase.co` |
| `DB_PASSWORD` | `Supabase@vocabmaxx` |

---

## Pending manual steps (do these before running `pnpm dev`)

### 1. Apply DB schema in Supabase SQL Editor

The direct Postgres connection is IPv6-only so `pnpm db:push` can't connect from a standard laptop. Apply both `drizzle/0000_next_wallow.sql` and `drizzle/0001_rls.sql` via Supabase SQL Editor (in order). `0000` creates tables, `0001` enables RLS + policies.

1. Go to **supabase.com/dashboard → project `qbogwjfneuswzwdykoxf` → SQL Editor → New query**
2. Paste contents of `drizzle/0000_next_wallow.sql` → **Run**
3. New query → paste contents of `drizzle/0001_rls.sql` → **Run**

Expected: 5 tables created (`words`, `srs_state`, `review_log`, `import_jobs`, `definition_cache`) with RLS enabled on all 5.

### 2. Configure Google OAuth in Supabase (if not done)

**Do NOT go to "OAuth Server" — that's for a different feature entirely.**

1. Supabase dashboard → **Authentication → Providers → Google**
2. Toggle **Enable**
3. Paste Client ID + Client Secret from `.env.local` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
4. **Save**

### 3. Configure Supabase Redirect URLs

Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add `http://localhost:3000/**`

Without this, after Google auth, Supabase blocks the redirect back to localhost.

### 4. Configure Google Cloud Console

In Google Cloud Console → APIs & Credentials → your OAuth 2.0 client:
- **Authorized JavaScript origins**: `http://localhost:3000`
- **Authorized redirect URIs**: `https://qbogwjfneuswzwdykoxf.supabase.co/auth/v1/callback`

### 5. Enable magic-link in Supabase

Supabase dashboard → **Authentication → Providers → Email**:
- Toggle **Enable**
- "Confirm email" can be off for dev

---

## How to run locally

```bash
cd ~/Downloads/VocabMaxx
pnpm dev
# open http://localhost:3000
```

Expected:
- `/` → marketing landing page
- `/auth/sign-in` → sign-in form (magic-link + Google button)
- `/dashboard` → redirects to sign-in if not logged in

---

## Phase 0 exit checklist (not yet ticked)

- [ ] `pnpm dev` → `localhost:3000` renders marketing page
- [ ] `pnpm build` → 0 errors
- [ ] `pnpm verify` → green *(locally confirmed green)*
- [ ] DB schema applied in Supabase SQL Editor
- [ ] Visit `/dashboard` unauthed → redirect to `/auth/sign-in`
- [ ] Sign in with Google → lands on `/dashboard` with "0 words due"
- [ ] Sign in with magic-link → email arrives → click → `/dashboard`
- [ ] CI green on GitHub Actions
- [ ] Deploy to Vercel → live URL works
- [ ] Update `README.md` with Vercel URL

---

## Vercel deploy (do after local test passes)

1. vercel.com → Add New Project → Import `lesaathvik24/vocabmaxx`
2. Framework: Next.js (auto-detected)
3. Add all keys from `.env.local` as environment variables
4. Also add `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`
5. Click Deploy
6. After deploy: add Vercel URL to Supabase → Auth → URL Configuration → Redirect URLs (`https://vocabmaxx.vercel.app/**`)
7. Add Vercel URL to Google Cloud Console → Authorized JavaScript origins + redirect URIs

---

## File map (key files)

```
app/
  (marketing)/page.tsx          landing page
  (app)/layout.tsx              server guard (requireUser())
  (app)/dashboard/page.tsx      protected dashboard shell
  auth/sign-in/page.tsx         sign-in (Google + magic-link)
  auth/sign-up/page.tsx         sign-up (magic-link via signInWithOtp)
  auth/callback/route.ts        OAuth callback handler (validated next param)
  layout.tsx                    root layout (PostHog provider)
  globals.css

lib/
  domain/grade.ts               Grade enum (0|3|4|5)
  domain/srs.ts                 SM-2 nextState() function
  domain/word.ts                Word + WordWithSRS types
  domain/errors.ts              Result<T,E>, error unions
  auth/client.ts                Supabase browser client
  auth/server.ts                Supabase server client + requireUser()
  auth/middleware.ts            Auth middleware helper
  db/schema.ts                  Drizzle schema (5 tables)
  db/client.ts                  Drizzle DB client
  analytics/posthog.tsx         PostHog provider
  validation/capture.schema.ts  Zod: capture input
  validation/review.schema.ts   Zod: grade input
  validation/word.schema.ts     Zod: edit word input
  utils/cn.ts                   clsx + tailwind-merge
  utils/errors.ts               toUserMessage()
  utils/result.ts               ok() + err() helpers

middleware.ts                   Next.js middleware (auth guard)
drizzle/0000_next_wallow.sql    canonical schema (5 tables)
drizzle/0001_rls.sql            RLS enable + policies (paste 2nd)
tests/unit/srs.test.ts          SM-2 unit tests (10 passing)
.github/workflows/ci.yml        CI (lint + typecheck + test:unit)
```

---

## Design decisions made

- **DeepSeek** instead of Anthropic for LLM fallback (same API shape)
- **No Plausible** — PostHog only for analytics
- **No Plausible script** — remove any reference if found
- **Sentry free tier** — kept, DSN configured
- **jsdom** installed as devDep but vitest uses `node` env by default; individual component test files can add `// @vitest-environment jsdom` when needed

---

## What the next session should do

Start Phase 1 (from `docs/ROADMAP.md`) only after Phase 0 checklist is fully ticked.

Phase 1 = capture flow: `POST /api/capture`, definition service (dict → DeepSeek fallback), word saved to DB, `/capture` UI page.

Do NOT start Phase 1 until:
1. `pnpm dev` works locally
2. Sign-in works (both Google and magic-link)
3. DB schema applied and verified in Supabase table editor
