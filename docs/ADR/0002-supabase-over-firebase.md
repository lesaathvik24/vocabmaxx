# ADR 0002 — Supabase as the BaaS layer

**Status:** Accepted
**Date:** 2026-06-07

---

## Context

VocabMaxx needs auth, a relational DB with multi-tenant isolation, and ideally row-level security so a developer mistake at the API layer can't leak data across users. Single-developer project, free-tier budget, must scale to ~100 users without rearchitecting.

## Decision

Use **Supabase** as the backend-as-a-service:
- Postgres database with built-in RLS.
- Supabase Auth (Google OAuth + email magic-link).
- Supabase JS client for the browser (anon key + session JWT).
- Drizzle ORM for typed queries against the same Postgres.

## Alternatives considered

### 1. Firebase
- Mature, battle-tested.
- NoSQL document model — wrong shape for relational vocab + SRS state + review log.
- Security rules are stringly-typed and hard to test.
- Vendor lock-in is total.
- Rejected: relational data wins; SQL skills transfer everywhere.

### 2. Clerk for auth + separate Postgres (Neon / Railway)
- Clerk is the gold-standard auth UX.
- Two services, two billing relationships, two SDKs.
- Free Clerk tier limits to 10k MAU; Neon free tier is generous but separate.
- Rejected: a single integrated tier wins for solo-dev cognitive load.

### 3. Self-host Postgres + Auth.js
- Maximum control, zero vendor risk.
- Solo dev — running a Postgres VPS is a distraction from the product.
- Rejected: cost of attention > cost saved.

### 4. PlanetScale + Clerk
- PlanetScale's MySQL fork was discontinued for the hobby tier in 2024.
- Rejected: dead at the free tier.

### 5. Convex
- Reactive backend with TypeScript-first ergonomics.
- Smaller ecosystem; harder to demonstrate "I know Postgres" to recruiters.
- Rejected: recruiter signal value.

## Consequences

### Positive
- **One dashboard** for auth + DB + storage + edge functions.
- **RLS by default** — multi-tenant isolation enforced at the DB layer, not the API.
- **Generous free tier** — 500MB DB, 50k MAU, more than enough for v1.
- **Open source core** — Postgres is portable; we can leave with a `pg_dump`.

### Negative
- **Connection pooling** in serverless requires PgBouncer (`?pgbouncer=true` in DSN). One footgun to know.
- **Migrations:** Supabase has its own migration story; we use Drizzle's instead. Drizzle ignores Supabase Studio schema changes — convention: all schema goes through code.
- **Email provider rate limits** for magic-links on the free tier — 4/hr per user. Acceptable for v1.

## Verification

- `pnpm db:push` applies schema to local Supabase.
- Two-user RLS test passes (see `tests/integration/db/rls.test.ts`).
- A user can sign in with Google OAuth end-to-end on the Vercel preview.

## References

- DB schema: `lib/db/schema.ts`.
- RLS policies: `drizzle/0001_rls.sql`.
- Auth flow: [`ARCHITECTURE.md`](../ARCHITECTURE.md) §6.
