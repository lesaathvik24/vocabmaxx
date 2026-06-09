# Contributing — VocabMaxx

A guide for any engineer (including future-you) setting up this repo and shipping code into it.

---

## 1. Prerequisites

| Tool | Version | How to install |
|---|---|---|
| Node.js | ≥ 20.x | `brew install node@20` or `nvm install 20` |
| pnpm | ≥ 9.x | `corepack enable && corepack prepare pnpm@latest --activate` |
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| Docker Desktop | latest | for local Supabase only — _optional, see §3.3_ |
| `gh` | latest | `brew install gh` |

You do **not** need Xcode, Android Studio, or a JDK. The repo is web-only.

## 2. First-time setup

```bash
# Clone
gh repo clone lesaathvik24/vocabmaxx-saas
cd vocabmaxx-saas

# Install
pnpm install

# Env
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY (others optional in dev)

# DB
pnpm db:push                  # applies Drizzle schema + RLS migrations

# Run
pnpm dev                      # http://localhost:3000
```

## 3. Local development

### 3.1 Day-to-day commands

```bash
pnpm dev            # Next dev server
pnpm test           # all tests once
pnpm test:watch     # unit tests in watch mode
pnpm test:unit      # only unit
pnpm test:integ     # integration (requires local DB)
pnpm test:e2e       # Playwright against localhost:3000
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm verify         # lint + typecheck + unit + integration — same as CI gate
pnpm db:push        # apply schema changes
pnpm db:generate    # generate Drizzle migration
pnpm db:studio      # Drizzle Studio
pnpm format         # Prettier
```

### 3.2 Two Supabase options

- **Hosted (recommended):** create a free project at supabase.com, copy URL + anon key. Fast, no Docker.
- **Local (CLI):** `supabase start` → spins up Postgres + Auth in Docker. Needed only for integration tests that mutate state. CI uses this mode.

### 3.3 LLM keys

The Anthropic key is required for the LLM fallback path. Without it, capture works only for words the free dictionary has. You can ship features without it; tests will mock it.

## 4. Code conventions

### 4.1 TypeScript

- `strict: true`. No `any` without a typed `as` cast at a justified boundary.
- Prefer **interfaces** for object shapes, **type aliases** for unions.
- Discriminated unions for state machines (`{ kind: '...' }`).
- Return `Result<T, E>` from services. Never throw across layer boundaries.

### 4.2 File layout

- One default export per file.
- Co-locate small helpers; promote to `lib/utils/` when reused across ≥ 2 files.
- React Server Components by default. Client Components opt-in with `'use client'` directive at top.
- A Client Component file must not import server-only modules (`lib/db`, `lib/auth/server`).

### 4.3 Naming

| Thing | Convention | Example |
|---|---|---|
| Component | PascalCase | `WordList.tsx` |
| Hook | camelCase, `use` prefix | `useDueCount.ts` |
| Service module | kebab-case + `.service.ts` | `definition.service.ts` |
| Query module | kebab-case in `lib/db/queries/` | `words.ts` |
| Test file | mirrors source, `.test.ts(x)` | `srs.test.ts` |
| Zod schema | suffix `.schema.ts` | `capture.schema.ts` |

### 4.4 Comments

Only when the WHY is non-obvious. Identifiers carry the WHAT. One line max. No JSDoc unless the function is exported as part of the public API surface (rare in this repo).

### 4.5 Style

Prettier handles it. Don't argue with it.

## 5. Git & PRs

### 5.1 Branch model

- `main` is always deployable.
- Work on short-lived feature branches: `phase-N/<short-description>` (e.g. `phase-3/definition-service`).
- One PR per subtask in `ROADMAP.md`. Reference the subtask ID in the PR description.

### 5.2 Commit conventions

Conventional Commits, but lean:

```
feat(capture): add paragraph extraction
fix(srs): clamp ease factor floor at 1.3
chore(deps): bump next to 15.x
docs(arch): correct data flow diagram for /api/review/grade
test(srs): cover repeated again sequence
```

Subject ≤ 72 chars. Body explains the WHY if non-obvious.

### 5.3 PR checklist

- [ ] Subtask ID referenced (e.g. `Closes ROADMAP §3.4`).
- [ ] Tests added/updated; CI green.
- [ ] ROADMAP checkbox flipped.
- [ ] If architectural decision: ADR drafted.
- [ ] No new lint warnings.
- [ ] Vercel preview link verified manually.

### 5.4 No-merge rules

- **Never** merge with red CI.
- **Never** force-push to `main`. Force-pushes to feature branches OK before merge.
- **Never** commit secrets. Pre-commit hook (`.husky/pre-commit`) runs `gitleaks` scan.

## 6. Testing requirements

Every PR introducing logic must include matching tests.

| Logic type | Test type | Required |
|---|---|---|
| Pure function in `lib/domain/` | Vitest unit | yes — 100% coverage in this layer |
| Service in `lib/services/` | Vitest unit with mock IO | yes |
| Service touching DB | Vitest integration with local Postgres | yes |
| Route handler | Vitest integration (in-process Next handler) | yes for happy path + auth fail |
| React component | Vitest + RTL | yes for stateful components |
| Full feature flow | Playwright e2e | yes for each ROADMAP phase exit |

**Coverage gates** (`pnpm test:coverage`):
- `lib/domain/`: 85% lines, 90% branches.
- `lib/services/`: 80% lines.
- Routes: 70% lines (e2e covers the rest).

**Mocking rule:** mock external IO only. Never mock domain modules.

## 7. Database changes

1. Edit `lib/db/schema.ts`.
2. `pnpm db:generate` → produces a numbered SQL file in `drizzle/`.
3. Review the generated SQL — Drizzle isn't always optimal, hand-tune.
4. `pnpm db:push` → applies locally.
5. Add an integration test exercising the new shape.
6. Commit `schema.ts` + the migration file together.

For production: see [`RUNBOOK.md`](RUNBOOK.md) §3.

## 8. Adding a shadcn component

```bash
npx shadcn@latest add <component>
```

Confirm the file lands in `components/ui/`. Hand-tweak only `cva` variants — never logic.

## 9. Working with Claude Design

See [`DESIGN.md`](DESIGN.md) §4 for the full contract. TL;DR:

1. User generates a component in Claude Design.
2. Paste into `components/<feature>/<Name>.tsx`.
3. Verify it imports only from `@/components/ui/*` + `lucide-react` + `react`.
4. Wire data via a hook from `lib/hooks/`.
5. Write a Vitest component test for empty + loading + error states.

If the design violates the contract, request a revision rather than patching.

## 10. Releasing

There is no formal release process. Push to `main` → Vercel deploys. For breaking schema changes:

1. Migration must be backwards-compatible (additive) OR include a planned downtime window.
2. Announce in commit body if downtime needed.

## 11. Issues and roadmap

- Open issues against the GitHub repo; tag with `phase-N` if related to a roadmap subtask.
- New feature ideas go into a `## Backlog` section in `ROADMAP.md` (NOT in issues — keeps the issue tracker focused on bugs and active work).

## 12. Code of conduct

Solo repo for now. If contributors arrive: be kind, be specific, ship.

---

**Cross-references**

- Architectural context: [`ARCHITECTURE.md`](ARCHITECTURE.md).
- What the contracts look like: [`TECH_SPEC.md`](TECH_SPEC.md).
- Ops and incident response: [`RUNBOOK.md`](RUNBOOK.md).
- Security baseline: [`SECURITY.md`](SECURITY.md).
