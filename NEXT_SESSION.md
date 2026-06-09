# Next Session Handoff — VocabMaxx

**Read this first.** This file is the complete context a new agent session needs to pick up and start executing Phase 0.

---

## What has been done (this session)

All documentation written. Nothing executed. No `pnpm`, no `git`, no provisioning.

Files now in `~/Downloads/vocabmaxx/`:

```
README.md                   — top-level, recruiter-facing
NEXT_SESSION.md             — this file
docs/
  PRD.md                    — product requirements
  ARCHITECTURE.md           — system design + data flow
  TECH_SPEC.md              — service contracts, DB schema, API contracts, SM-2 algorithm
  ROADMAP.md                — phased delivery with subtask tracking + manual test steps
  DESIGN.md                 — design system + Claude Design handoff contract
  CONTRIBUTING.md           — dev setup, conventions, PR checklist
  SECURITY.md               — auth model, RLS, secrets, threat model
  RUNBOOK.md                — deploy, rollback, migration, incident response
  ADR/
    0001-nextjs-app-router.md
    0002-supabase-over-firebase.md
    0003-drizzle-over-prisma.md
    0004-shadcn-component-strategy.md
    0005-hybrid-definition-pipeline.md
    0006-sm2-vs-fsrs.md
  api/
    openapi.yaml             — OpenAPI 3.1 spec for all routes
```

## What this session must do

Execute **Phase 0 only** (from `docs/ROADMAP.md`). Stop after Phase 0 exit criteria are met.

---

## Step-by-step execution

### Step 1 — Scaffold Next.js

```bash
cd ~/Downloads/vocabmaxx
pnpm create next-app . \
    --typescript \
    --tailwind \
    --app \
    --no-src-dir \
    --import-alias "@/*" \
    --eslint
```

Answer prompts: App Router yes, no src dir, `@/*` alias.

### Step 2 — Install dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr drizzle-orm postgres zod \
    @sentry/nextjs posthog-js lucide-react class-variance-authority clsx \
    tailwind-merge next-pwa resend

pnpm add -D drizzle-kit vitest @vitejs/plugin-react \
    @testing-library/react @testing-library/user-event \
    msw playwright @playwright/test \
    @types/node tsx dotenv-cli husky gitleaks
```

### Step 3 — Initialize shadcn/ui

```bash
npx shadcn@latest init
# Choose: Default style, Slate base color, CSS variables yes
npx shadcn@latest add button input dialog toast dropdown-menu badge skeleton card separator
```

### Step 4 — Create folder structure

Exactly as described in `docs/ARCHITECTURE.md §2`. Key folders:

```
app/(marketing)/
app/(app)/dashboard/
app/api/
app/auth/
components/ui/            ← already created by shadcn
components/layout/
components/capture/
components/review/
components/words/
components/insights/
components/dashboard/
components/marketing/
lib/domain/
lib/services/
lib/db/queries/
lib/auth/
lib/validation/
lib/analytics/
lib/utils/
drizzle/
tests/unit/
tests/integration/
tests/e2e/
extension/
public/
docs/                     ← already exists, leave as is
```

### Step 5 — Config files

Create these from the specs in `docs/TECH_SPEC.md` and `docs/CONTRIBUTING.md`:

- `vitest.config.ts`
- `playwright.config.ts`
- `drizzle.config.ts`
- `.env.example` (from TECH_SPEC §11)
- `.gitignore`
- `.husky/pre-commit` (lint + gitleaks)
- `package.json` scripts: `dev`, `build`, `test`, `test:unit`, `test:integ`, `test:e2e`, `typecheck`, `lint`, `verify`, `db:push`, `db:generate`, `db:studio`, `db:reset`, `format`

### Step 6 — Write domain + auth stubs

These are needed for the build to succeed before any feature lands:

- `lib/domain/grade.ts` — `Grade` enum (from TECH_SPEC §3)
- `lib/domain/srs.ts` — `nextState()` pure function (from TECH_SPEC §3)
- `lib/domain/word.ts` — `Word` type
- `lib/domain/errors.ts` — `Result<T,E>`, error unions
- `lib/auth/client.ts` — Supabase browser client
- `lib/auth/server.ts` — Supabase server client + `getSession()` + `requireUser()`
- `lib/auth/middleware.ts` — auth check function
- `middleware.ts` — Next middleware applying auth to `/(app)/*`
- `lib/db/schema.ts` — full Drizzle schema (from TECH_SPEC §1)
- `lib/db/client.ts` — Drizzle client creation

### Step 7 — DB migration

```bash
cp .env.example .env.local
# User must fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
# If they haven't created a Supabase project yet, prompt them to do so:
#   1. Go to supabase.com → New project
#   2. Copy URL + anon key + service role key into .env.local
pnpm db:push
```

### Step 8 — Landing page + auth pages

- `app/(marketing)/page.tsx` — hero, feature list, CTA (text only, no images; Claude Design will replace later)
- `app/auth/sign-in/page.tsx` — sign-in form with Google + magic-link
- `app/auth/sign-up/page.tsx` — sign-up form
- `app/auth/callback/route.ts` — Supabase OAuth callback handler
- `app/(app)/dashboard/page.tsx` — empty shell with "Welcome, {email}" and "0 words due"

### Step 9 — CI

`.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:unit
```

### Step 10 — (skipped) PWA manifest

PWA install + offline support are deferred to **Phase X** (post-v1). Do not create `public/manifest.json` or wire `next-pwa` in Phase 0.

### Step 11 — Sentry + analytics stubs

- `sentry.client.config.ts`, `sentry.server.config.ts` — initialise Sentry with `NEXT_PUBLIC_SENTRY_DSN`.
- `lib/analytics/posthog.ts` — PostHog provider wrapper.
- Wire provider into `app/layout.tsx`.

### Step 12 — Observability stubs

- `lib/utils/errors.ts` — `toErrorKind()` + user-facing error message map
- `lib/utils/result.ts` — `ok()` + `err()` helpers

### Step 13 — Unit tests for domain layer

Write `tests/unit/srs.test.ts` with all 15 cases from `docs/TECH_SPEC.md §3`. **All must pass before this step is done.**

### Step 14 — Git + GitHub

Repo already exists at `github.com/lesaathvik24/vocabmaxx` and `origin` remote is set.
iOS archive is already at `vocabmaxx-ios-archive`. Just commit + push:

```bash
cd ~/Downloads/VocabMaxx
git add .
git commit -m "phase 0: scaffold SaaS foundation

Next.js 15, TypeScript, Tailwind v4, shadcn/ui, Supabase Auth,
Drizzle + Postgres schema, SM-2 domain layer, CI,
Sentry, PostHog stubs. Full docs in docs/.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push origin master
```

### Step 15 — Delete old iOS folder

After confirming the commit and push succeeded:

```bash
rm -rf ~/Downloads/lifemaxxing/01_job_switch/projects/vocabmaxx/
```

### Step 16 — Vercel deploy (manual — user does this)

The agent cannot log in to Vercel. Prompt the user:

```
1. Go to vercel.com → Add New Project → Import from GitHub → vocabmaxx
2. Framework Preset: Next.js (auto-detected)
3. Add all env vars from .env.local (copy-paste each one)
4. Click Deploy
5. Copy the deployed URL and paste here so I can update the README
```

### Step 17 — Phase 0 exit checklist

After the deploy URL is known:

- [ ] `pnpm dev` works locally
- [ ] `pnpm build` succeeds
- [ ] `pnpm test:unit` — all 15+ SM-2 tests pass
- [ ] `pnpm verify` — all green
- [ ] `/` marketing page loads on Vercel URL
- [ ] Sign up with Google → lands on `/dashboard`
- [ ] Sign up with magic-link → confirmation email arrives → lands on `/dashboard`
- [ ] `/dashboard` shows "0 words due"
- [ ] ROADMAP.md Phase 0 checkboxes all flipped
- [ ] `README.md` updated with live Vercel URL

When all checked, **Phase 0 is done**. Begin Phase 1 in a new session or continue in this one.

---

## Context the next session needs

- **Working dir:** `~/Downloads/vocabmaxx/`
- **GitHub repo:** `github.com/lesaathvik24/vocabmaxx` — already exists, origin remote set.
- **Old iOS repo:** already renamed to `vocabmaxx-ios-archive`.
- **Supabase project:** credentials already in `.env.local` (project ref: `qbogwjfneuswzwdykoxf`). Also paste into Vercel env vars.
- **LLM:** DeepSeek — key in `.env.local` as `DEEPSEEK_API_KEY`. No Anthropic needed.
- **Design:** Claude Design handles frontend visuals; see `docs/DESIGN.md §4` for the handoff contract
- **Architecture decisions:** all in `docs/ADR/`
- **Phase tracker:** `docs/ROADMAP.md` — flip `[ ] → [x]` on each subtask

## Things not to do in the next session

- Do NOT run Playwright e2e tests until the Vercel preview URL is available (Steps 13-14 happen first).
- Do NOT install extra npm packages without checking `docs/TECH_SPEC.md §2` first.
- Do NOT commit without running `pnpm verify`.
- Do NOT touch `docs/` except to update ROADMAP checkboxes.
- Do NOT delete `NEXT_SESSION.md` — update it for the following session instead.
