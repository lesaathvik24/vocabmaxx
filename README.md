# VocabMaxx

> For serious English-vocabulary learners. Capture a word, get a clean definition and real-world examples, and let spaced repetition handle when you see it again.

**Live demo:** _coming soon_ &nbsp;·&nbsp; **Docs:** [`docs/`](docs/) &nbsp;·&nbsp; **Status:** Phase 0 (scaffolding)

---

## What it does

You hear a new word in a podcast, read it in an article, or come across it in conversation. VocabMaxx makes the loop from "I just heard a word" → "I now own that word" as short as possible.

- **Capture** — type a word, or paste a paragraph and let an LLM extract the advanced terms.
- **Auto-explain** — hybrid dictionary + LLM gives a clean definition, two natural usage examples, and a memorable hook.
- **SM-2 spaced repetition** — review queue resurfaces each word at the moment your forgetting curve drops.
- **Cross-device** — log in on phone, laptop, anywhere. Data syncs instantly.
- **Insights** — vocabulary growth chart, retention rate, problem words.

_Browser extension + installable PWA are planned post-v1 — see `docs/ROADMAP.md` Phase X._

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript (strict) |
| UI | Tailwind v4 · shadcn/ui · Radix Primitives |
| Auth | Supabase Auth — email magic-link + Google OAuth |
| Database | Supabase Postgres + Row-Level Security |
| ORM | Drizzle |
| Validation | Zod (shared client/server) |
| Email | Resend (transactional + daily digest) |
| Analytics | PostHog (product) + Plausible (web) |
| Errors | Sentry |
| Deploy | Vercel |
| CI/CD | GitHub Actions |
| Testing | Vitest (unit/integration) + Playwright (e2e) |

Architecture decisions are documented in [`docs/ADR/`](docs/ADR/).

## Getting started

```bash
git clone https://github.com/lesaathvik24/vocabmaxx.git
cd vocabmaxx
pnpm install
cp .env.example .env.local            # fill in Supabase, Anthropic keys
pnpm db:push                          # apply Drizzle schema
pnpm dev                              # http://localhost:3000
```

Full setup is in [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). Production ops procedures are in [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

## Documentation

| Doc | What's in it |
|---|---|
| [`PRD.md`](docs/PRD.md) | Product requirements: problem, users, features, metrics, GTM |
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, data flow, infra diagram |
| [`TECH_SPEC.md`](docs/TECH_SPEC.md) | Service contracts, API routes, DB schema, validation |
| [`ROADMAP.md`](docs/ROADMAP.md) | Phased delivery plan with subtask tracking |
| [`DESIGN.md`](docs/DESIGN.md) | Design system principles + Claude Design handoff contract |
| [`SECURITY.md`](docs/SECURITY.md) | Auth model, RLS, secret handling, threat model |
| [`CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Dev setup, commit conventions, PR template |
| [`RUNBOOK.md`](docs/RUNBOOK.md) | Deploy, rollback, migration, incident response |
| [`ADR/`](docs/ADR/) | Architecture Decision Records (6 to date) |
| [`api/openapi.yaml`](docs/api/openapi.yaml) | OpenAPI 3 spec for the public API |

## Engineering principles

- **Strict TypeScript, end-to-end.** Zod at every API boundary; no `any` without a typed escape hatch.
- **Deep modularity.** Services are pure functions with explicit interfaces. Components consume services only via hooks. Domain layer has zero React imports.
- **Fail loud at boundaries.** Typed `Result<T, E>` unions. No silent catches.
- **Tests with the code they cover.** A PR without tests for new logic does not merge.
- **Illegal states unrepresentable.** Discriminated unions everywhere a state machine lives.
- **One source of truth.** Zod schemas, Drizzle schema, OpenAPI — generated, not hand-synced.

## License

MIT.

---

Built by [Lekhan Saathvik](https://github.com/lesaathvik24).
