# Security Model — VocabMaxx

**Audience:** anyone reviewing this repo for security posture, anyone making security-relevant changes.
**Scope:** auth, multi-tenant isolation, secret handling, supply chain, application-level threats.

> This is a personal-use SaaS with multi-tenant architecture. Threat model assumes occasional curious visitors, not targeted attackers. Standard hygiene > exotic controls.

---

## 1. Trust boundaries

```
   ┌──────────────┐
   │ Browser      │  ← user input, untrusted
   └──────┬───────┘
          │ HTTPS
   ┌──────┴───────┐
   │ Vercel edge  │  ← trusted runtime, server code
   └──────┬───────┘
          │ JWT + RLS-enforced queries
   ┌──────┴───────┐
   │ Supabase DB  │  ← trusted, data at rest
   └──────────────┘
```

Anything crossing the browser → server boundary is untrusted and must be validated. Anything crossing the server → DB boundary is gated by RLS.

## 2. Authentication

### 2.1 Providers

- **Supabase Auth** is the single source of truth for identity.
- Two methods: Google OAuth (preferred) and email magic-link (fallback).
- No password-based auth. Reduces attack surface (no credential stuffing, no password reset flows to abuse).

### 2.2 Session

- Sessions are HTTP-only, Secure, SameSite=Lax cookies set by Supabase SSR helper.
- Refresh tokens rotated on every refresh.
- Default expiry: 7 days; refresh extends another 7. Inactivity logout: 30 days.

### 2.3 OAuth callback

`/auth/callback` accepts the `code` query param, exchanges with Supabase, sets cookies, redirects to the `next` param (validated to be a same-origin path) or `/dashboard`. Open-redirect prevented by `next` allowlist regex.

## 3. Authorization

### 3.1 Two layers

1. **Server middleware** (`middleware.ts`) checks for a valid session before serving any `/(app)/*` page.
2. **DB-level RLS** is the source of truth — every domain table has `owner_all` policies enforcing `auth.uid() = user_id`.

If a route handler accidentally forgets to check auth (developer error), RLS still prevents cross-tenant data leak because the session-scoped Supabase client returns 0 rows for queries the user isn't authorized to make.

### 3.2 Service role key

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is used in **two places only**:

1. `definition_cache` writes (the cache is shared across users; insertions are server-side).
2. The Vercel Cron handler `/api/cron/daily-digest` — deferred to Phase 8; when implemented, it will iterate over all users to send digest emails.

The key is never exposed in client bundles (no `NEXT_PUBLIC_` prefix) and never logged. Audit trail: see `lib/db/client.ts` — any non-anon Drizzle client lives there.

## 4. Input validation

Every request body is parsed through Zod at the route handler entry. Failed parses return `400` with a typed error code; the unsafe input never reaches a service.

- `app/api/capture/route.ts` → `captureSchema`
- `app/api/review/grade/route.ts` → `gradeSchema`
- `app/api/words/[id]/route.ts` (PATCH) → `editWordSchema`
- `app/api/words/import/route.ts` → `importSchema` (discriminated union over `mode`)

URL params and search params are also Zod-validated.

## 5. Output encoding

- React handles HTML escaping by default — never use `dangerouslySetInnerHTML`. CI lint rule blocks it (`react/no-danger`).
- JSON responses use `NextResponse.json()` — no manual serialization.

## 6. Rate limiting

- `/api/capture` and `/api/words/import` are rate-limited via an **in-memory token-bucket** (`lib/utils/rate-limit.ts`), applied per serverless instance.
- This is best-effort: because Vercel functions are stateless, the counter is not shared across instances. It prevents runaway bursts within a single instance but is not a hard global cap.
- Excess returns `429` with a `Retry-After` header.
- Planned hardening: replace with a shared store (Upstash Redis or similar) for a true distributed rate limit.

## 7. Secret management

| Secret | Where | Access |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | public (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | env var, Vercel |
| `DEEPSEEK_API_KEY` | server only | env var, Vercel |
| `DEEPSEEK_BASE_URL` | server only | env var, Vercel (optional, defaults to api.deepseek.com) |
| `RESEND_API_KEY` | server only | env var, Vercel |
| `CRON_SECRET` | server only | env var, Vercel; used to auth cron handler |
| `NEXT_PUBLIC_POSTHOG_KEY` | client + server | public (designed for it) |

### 7.1 Rotation policy

- Rotate `SUPABASE_SERVICE_ROLE_KEY` if any contributor leaves the project.
- Rotate `DEEPSEEK_API_KEY` quarterly or on suspected leak.
- Rotate `CRON_SECRET` on every breaking-change deploy.

### 7.2 Leak prevention

- `.env.local` is in `.gitignore`.
- Pre-commit hook (`.husky/pre-commit`) runs `pnpm lint && pnpm typecheck`.
- CI runs `gitleaks` secret-scan on every PR.
- No secret should ever appear in a commit message or PR description.

## 8. Supply chain

- **Lockfile committed** — `pnpm-lock.yaml`. Reproducible installs.
- **Dependabot** enabled for security updates on the GitHub repo.
- **No direct deps with < 1k weekly downloads** without manual review.
- **Audit script:** `pnpm audit --prod` runs in CI; high-severity vulns fail the build.
- **Browser extension** deferred (Phase X); no extension signing in CI.

## 9. Logging & PII

- **What we log:** request method, path, status, latency, user ID (UUID).
- **What we do not log:** request bodies, definitions, examples, raw terms (vocab is sensitive — a user's vocab list reveals what they're learning).
- **Error logging:** errors are logged to Vercel platform logs only. No third-party error tracker is currently wired in.
- **PostHog:** `disable_session_recording` on. We track event names + counts, not content.

## 10. Cookies

- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
- No tracking cookies.
- No third-party cookies set by our origin.

## 11. CORS

- `/api/*` accepts requests only from the same origin (default Next behavior).
- Browser extension's `manifest.json` `host_permissions` allow `https://vocabmaxx.com/*` to bypass CORS for the extension's own fetch calls — those requests still carry the user's session cookie.

## 12. Content Security Policy

Set via `next.config.ts` headers:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://*.posthog.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co https://api.deepseek.com https://*.posthog.com;
frame-ancestors 'none';
```

`'unsafe-inline'` for scripts is tolerated only because Next's hydration scripts require it; will tighten via nonce in v1.5.

## 13. Threat model (v1)

| Threat | Mitigation |
|---|---|
| Cross-user data leak | RLS on every domain table; integration tests assert cross-user queries return 0 rows. |
| Stolen session cookie | HttpOnly + Secure + SameSite=Lax; short refresh rotation. |
| SQL injection | Drizzle parameterizes; no raw `sql` template with user input. |
| XSS via stored content | React escaping + `dangerouslySetInnerHTML` lint ban; definitions render as text only. |
| Open redirect | `next` allowlist on auth callback. |
| Brute-force capture API | In-memory token-bucket rate limit per serverless instance (`lib/utils/rate-limit.ts`). |
| Leaked service role key | Rotation policy + gitleaks in CI + Dependabot for any tooling that touches it. |
| Malicious extension impersonation | Extension deferred (Phase X); not applicable in v1. |
| LLM prompt injection (paragraph extract) | LLM output parsed via Zod schema; nothing executed from the LLM response. Only `term` strings used downstream, sanitized. |

## 14. Out-of-scope threats (v1)

These are explicitly **not** addressed in v1; revisit before a multi-user public launch:

- DDoS at the edge — Vercel handles basic, no WAF.
- Insider threat (only contributor is me).
- Compromised CI runner — GitHub Actions OIDC is fine for current trust level.
- Cryptographic timing attacks on auth — Supabase Auth handles this.
- Side-channel info leak from cache hit/miss timing.

## 15. Incident response

See [`RUNBOOK.md`](RUNBOOK.md) §6 for the full procedure. Quick version:

1. **Detect:** Vercel logs alert, user report, or unexpected PostHog metric.
2. **Contain:** roll back Vercel deploy; rotate any suspected-leaked secret.
3. **Eradicate:** patch the underlying cause; add a regression test.
4. **Postmortem:** within 48h, add an ADR documenting cause + fix.

---

**Cross-references**

- Architectural context: [`ARCHITECTURE.md`](ARCHITECTURE.md).
- Per-route validation contracts: [`TECH_SPEC.md`](TECH_SPEC.md) §6.
- Deploy / rollback procedures: [`RUNBOOK.md`](RUNBOOK.md).
