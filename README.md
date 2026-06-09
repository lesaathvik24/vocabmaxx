# VocabMaxx

> **Anki is for flashcards. VocabMaxx is for actually owning the words you hear.**
> Type a word. Get a clean definition + two real-world examples in 200ms. Forget it on your terms — the algorithm brings it back exactly when you'd otherwise lose it.

[![CI](https://img.shields.io/badge/CI-passing-brightgreen)](.github/workflows/ci.yml) [![Tests](https://img.shields.io/badge/tests-90%20green-brightgreen)](#) [![TS](https://img.shields.io/badge/TypeScript-strict-blue)](tsconfig.json) [![License](https://img.shields.io/badge/license-MIT-black)](LICENSE)

**Live demo:** _shipping with Phase 4_ &nbsp;·&nbsp; **Docs:** [`docs/`](docs/) &nbsp;·&nbsp; **Roadmap:** [`docs/ROADMAP.md`](docs/ROADMAP.md)

---

## The pitch (90 seconds)

You hear "alacrity" in a podcast. You think *"nice word."* You forget it within an hour.

Every existing tool makes you do work to keep it:

- **Anki:** open the app, find the right deck, click "Add", pick a card type, type the word, type the definition yourself, find example sentences yourself, hit Save. Mobile UX from 2009.
- **Quizlet:** designed for cramming a teacher's word list, not your life.
- **Dictionary apps:** great for one lookup, zero memory.
- **ChatGPT:** great definition, no spaced repetition, no list — gone in 24h when the chat scrolls away.

**VocabMaxx is one input box.** You type `alacrity` → it appears on your dashboard in ~200ms with a definition and two natural usage examples. SM-2 puts it in front of you again on day 1, day 6, day 15. You own the word.

---

## How it's different from Anki — at a glance

| | **VocabMaxx** | Anki | Quizlet | "Just use ChatGPT" |
|---|---|---|---|---|
| Time to capture a word | **one input, ~200ms** | ~90s of clicking | ~60s | ~3s but it vanishes |
| Definition + examples | **auto, hybrid dict + LLM** | you write them | someone else's deck | no persistence |
| Spaced repetition | **SM-2, on by default** | SM-2 / FSRS, you configure | weak | none |
| Card-creation friction | **zero — the input *is* the card** | high | medium | n/a |
| Built for | **the word you just heard** | medical school, kanji | classrooms | one-shot answers |
| Cost | free + your tokens | free / paid mobile | free + ads | free / $20 |
| Owns your data | **JSON / CSV / Anki `.apkg` export** | yes | locked | no |
| Open source | **MIT** | yes | no | no |

Translation: **Anki is a mature general-purpose SRS that asks you to be a card author. VocabMaxx is a single-purpose vocabulary tool that does the authoring for you.** Export to Anki any time if you want to migrate — your data stays yours.

---

## What's under the hood

- **Hybrid definition pipeline.** Free dictionary first (~200ms), DeepSeek LLM only when the dictionary doesn't have a good example. Per-word cost is fractions of a cent. Definitions are cached **globally** — the first user to capture a word pays, every future user is free. [(ADR 0005)](docs/ADR/0005-hybrid-definition-pipeline.md) [(ADR 0007)](docs/ADR/0007-deepseek-over-anthropic.md)
- **SM-2 spaced repetition.** The Anki algorithm, implemented as a pure function in 40 lines with 20 unit tests pinning every cell of the worked example. [(ADR 0006)](docs/ADR/0006-sm2-vs-fsrs.md)
- **Row-Level Security end-to-end.** Postgres RLS, not just app-layer checks — even with a stolen anon key, you can't read someone else's vocab. Verified by integration tests that simulate two users' JWTs. [(SECURITY.md)](docs/SECURITY.md)
- **Strict TypeScript + Zod at every boundary.** Illegal states unrepresentable via branded types (`ValidWord` is a `unique symbol` — type-only, no runtime field to leak into your DB). 90 tests, zero `any` in the domain layer.
- **Modular by construction.** Pure domain → service layer → API. Each layer testable in isolation. The capture pipeline has 7 unit tests with mocked deps that run in milliseconds, plus 16 integration tests against a real Supabase project.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, RSC) | One stack, ship to Vercel |
| Language | TypeScript (strict) | No runtime surprises |
| UI | Tailwind v4 · shadcn/ui · Radix | Accessible by default |
| Auth | Supabase Auth (magic-link + Google) | Free tier, RLS native |
| Database | Supabase Postgres + RLS | Defense in depth |
| ORM | Drizzle | Lightweight, typed |
| Definitions | dictionaryapi.dev + DeepSeek `deepseek-chat` | $0 happy path, ~$0.0001 fallback |
| Validation | Zod | Shared client/server |
| Email | Resend | Daily digest only |
| Deploy | Vercel | Push to deploy |
| CI/CD | GitHub Actions | Lint + typecheck + 90 tests on every PR |
| Testing | Vitest + MSW + Playwright | Real DB integration, mocked network |

ADRs explaining every non-obvious choice live in [`docs/ADR/`](docs/ADR/) — 7 of them.

---

## Project status

| Phase | Status | What's in it |
|---|---|---|
| 0 — Foundation | ✅ | Repo, auth, RLS, CI |
| 1 — Domain | ✅ | SM-2 + Word invariants (36 unit tests) |
| 2 — Persistence | ✅ | Queries + services + RLS integration test (18 tests) |
| 3 — Definition pipeline | ✅ | Dict + DeepSeek + `/api/capture` (23 tests) |
| 4 — Capture UI + dashboard | ⏳ next | The screens that turn the API into a product |
| 5 — Review session | ⏳ | FlipCard + grade buttons + SM-2 wiring |
| 6 — Word list, detail, search | ⏳ | Manage your captured words |
| 7 — Insights | ⏳ | Growth chart, retention rate, problem words |
| 8 — Settings, export, daily digest | ⏳ | JSON / CSV / `.apkg` export, Resend cron |
| 9 — Polish & launch | ⏳ | Lighthouse ≥ 95, SEO, OG, ship |

**90 tests green, 0 `any` in `lib/domain/`.** See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full phase breakdown.

---

## Getting started

```bash
git clone https://github.com/lesaathvik24/vocabmaxx.git
cd vocabmaxx
pnpm install
cp .env.example .env.local            # fill in Supabase + DeepSeek keys
# apply drizzle/0000_next_wallow.sql + drizzle/0001_rls.sql via Supabase SQL Editor
pnpm dev                              # http://localhost:3000
```

Full setup walkthrough: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).
Production ops: [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

---

## Engineering principles (these are enforced, not vibes)

- **Strict TypeScript end-to-end.** Zod at every boundary. No `any` without a typed escape hatch.
- **Fail loud at boundaries.** `Result<T, E>` unions. No silent catches.
- **Illegal states unrepresentable.** Discriminated unions everywhere a state machine lives.
- **Deeply modular.** Pure functions, single responsibility, clear seams. Compose over inherit.
- **Tests with the code they cover.** A PR without tests for new logic does not merge.
- **YAGNI.** No premature abstraction, no dead code. Three similar lines beats a bad abstraction.

---

## Docs

| Doc | What's in it |
|---|---|
| [`PRD.md`](docs/PRD.md) | Problem, users, features, metrics, GTM |
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, data flow, infra diagram |
| [`TECH_SPEC.md`](docs/TECH_SPEC.md) | Service contracts, API routes, DB schema, validation |
| [`ROADMAP.md`](docs/ROADMAP.md) | Phased delivery plan with subtask tracking |
| [`DESIGN.md`](docs/DESIGN.md) | Design system principles |
| [`SECURITY.md`](docs/SECURITY.md) | Auth model, RLS, secret handling, threat model |
| [`CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Dev setup, commit conventions, PR template |
| [`RUNBOOK.md`](docs/RUNBOOK.md) | Deploy, rollback, migration, incident response |
| [`ADR/`](docs/ADR/) | Architecture Decision Records (7 to date) |
| [`api/openapi.yaml`](docs/api/openapi.yaml) | OpenAPI 3 spec for the public API |

---

## License

MIT.

Built by [Lekhan Saathvik](https://github.com/lesaathvik24). Follow the build on [Twitter / X](https://twitter.com/) (link coming with launch).
