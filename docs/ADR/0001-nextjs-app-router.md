# ADR 0001 — Next.js App Router as the primary framework

**Status:** Accepted
**Date:** 2026-06-07
**Decision driver:** Lekhan Saathvik

---

## Context

VocabMaxx needs to ship: a marketing site, an authenticated app, REST API routes, server-rendered pages for SEO, and a deploy story that takes 5 minutes to set up. Time-to-ship matters more than perfect framework choice. The user is solo, building outside of full-time hours.

The framework decision shapes everything downstream: the deploy target, the rendering model, the data-fetching primitives, the auth integration patterns, the testing tooling.

## Decision

Use **Next.js 16 (16.2.7) with the App Router** as the single framework for the entire web product.

Specifically:
- App Router (not Pages Router) — modern, future-aligned.
- React Server Components by default; Client Components opt-in via `'use client'`.
- Route Handlers (`app/api/*/route.ts`) for the API surface — no separate Express/Hono process.
- Vercel as the deploy target.

## Alternatives considered

### 1. Remix
- Server-by-default, web-standards-friendly form actions.
- Smaller ecosystem; deploy story less plug-and-play than Vercel.
- Rejected: Next.js's data-fetching ergonomics in RSC are better for the heavy read patterns of this app (dashboard, word list, insights).

### 2. SvelteKit
- Smaller bundle; clean DX; great DX scores in surveys.
- Smaller component ecosystem; shadcn-equivalent (`shadcn-svelte`) is less mature.
- Rejected: TypeScript story in shared schemas (Zod) is friendlier in React-land; smaller talent pool reduces recruiter signal value.

### 3. Astro + React islands
- Excellent for marketing sites; struggles with stateful SPA-shape apps.
- The authenticated app is heavily stateful (review queue, capture flow).
- Rejected: would need to bolt on a second SPA framework for the app side.

### 4. Vite + React + custom server
- Maximum control; minimum convention.
- Solo dev — convention is a feature.
- Rejected: too much wiring (routing, SSR, API, deploy) for the available time.

### 5. Pages Router (Next.js classic)
- Familiar, stable; SWR/React Query everywhere.
- App Router is where Next is investing; Pages Router will rot.
- Rejected: better to learn the future on a personal project than a job project.

## Consequences

### Positive
- **One repo, one deploy, one runtime.** No microservices.
- **RSC** means a lot of "fetch + render" code is trivially server-side, no waterfalls.
- **Vercel preview URLs** for every PR — recruiter-friendly demo links built in.
- **Big ecosystem** — Supabase, Drizzle, shadcn, PostHog all have first-class Next templates.

### Negative
- **Edge runtime quirks** — some Node APIs unavailable in Vercel Edge. Drizzle works on Node runtime; route handlers using DB must opt into Node runtime explicitly. Logged in `lib/db/client.ts`.
- **App Router is < 2 years old** — some patterns (testing, error boundaries) are still maturing.
- **Vercel lock-in** is real. Mitigation: nothing in our code is Vercel-specific except `vercel.json` cron config; could move to Cloudflare or self-host if needed.

## Verification

- The `pnpm build` succeeds on Phase 0 scaffold.
- Vercel preview URLs work for the first PR.
- We can run an integration test that hits a route handler in-process via Vitest.

## References

- Implementation: every file in `app/`.
- Cross-ADR: [0002 (Supabase)](0002-supabase-over-firebase.md), [0003 (Drizzle)](0003-drizzle-over-prisma.md).
