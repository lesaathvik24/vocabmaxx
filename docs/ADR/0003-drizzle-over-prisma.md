# ADR 0003 — Drizzle ORM over Prisma

**Status:** Accepted
**Date:** 2026-06-07

---

## Context

We need a typed ORM/query builder for Postgres. Two strong options dominate the TypeScript ecosystem: Prisma and Drizzle. The choice affects how migrations work, how queries are written, and how well the ORM plays with Supabase's RLS and serverless runtimes.

## Decision

Use **Drizzle ORM**.

## Alternatives considered

### 1. Prisma
- Dominant market share; large community; excellent DX (Prisma Studio, generated client).
- Schema lives in `schema.prisma` — a non-TypeScript DSL. Inference works well but the DSL is another language to maintain.
- Prisma Client bundles a query engine binary. Cold-start penalty matters in Vercel serverless.
- Migrations via `prisma migrate` are auto-generated and often need hand-editing.
- Rejected: cold-start cost + the extra DSL layer + binary size.

### 2. Drizzle
- Schema defined in TypeScript (`lib/db/schema.ts`). The schema IS the source of truth — no code generation step in dev.
- SQL-like query API — readable and predictable.
- Lighter runtime, no query engine binary. Works in Vercel Edge if needed.
- Drizzle Kit generates SQL migration files you can read and hand-edit.
- First-class support for Supabase Postgres (with PgBouncer pooling mode).

### 3. Raw SQL via `postgres` / `pg`
- Maximum control, no abstraction layer.
- No type safety without a lot of hand-coding.
- Rejected: the whole point of an ORM is to avoid writing repetitive typed boilerplate.

### 4. kysely
- Strongly typed SQL query builder; no ORM behavior.
- Excellent type safety; migrations are DIY.
- Rejected: Drizzle is further along on the schema-as-migration story.

## Consequences

### Positive
- **Schema in TypeScript** — one language, IDE autocomplete, no DSL drift.
- **Typed queries** — the return type of every query is inferred from the schema.
- **Drizzle Studio** ships with the package — visual DB viewer without Prisma license concerns.
- **Migration files are plain SQL** — reviewable, editable, committable.
- **No binary** — faster cold starts, smaller Vercel function size.

### Negative
- **Smaller community than Prisma** — some edge cases have fewer StackOverflow answers.
- **Drizzle Kit migrations** can over-generate (multiple statements for a simple column add). Always review before applying.
- **No `findUnique` convenience** — query style requires more explicit `.where()` chains.

## Verification

- `pnpm db:push` applies schema to local Supabase with no errors.
- Drizzle Studio opens at `localhost:4983`.
- Integration tests query real Postgres and return typed results.

## References

- Schema: `lib/db/schema.ts`.
- Query modules: `lib/db/queries/`.
- Client config: `lib/db/client.ts`, `drizzle.config.ts`.
