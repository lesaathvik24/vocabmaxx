# VocabMaxx — Session Handoff

**Read this first. This is the complete context for the next session.**

---

## State as of 2026-07-14 (pronunciation, push, UX, multi-sense)

### Shipped this session

| Feature | Notes |
|---|---|
| **Pronunciation** | `phonetic` + `audio_url` on `words` / `definition_cache`. `PronounceButton` plays the dictionary clip, falling back to browser `speechSynthesis` so *every* word is playable (incl. LLM-sourced and pre-existing rows). Mounted on flashcard (both faces), word detail, words list, capture card. CSP gained `media-src` for the audio CDN. |
| **Post-capture card** | `CapturedWordCard` — meaning, examples, phonetic + play, source badge, View word / Add another. Replaces the bare toast. |
| **Quick capture** | `QuickCaptureProvider` + dialog, bound to **⌘K/Ctrl+K**. Topbar CTA and mobile FAB open it instead of navigating to `/capture`. |
| **Web push** | `push_subscriptions` table, `public/sw.js`, `POST`/`DELETE /api/push/subscribe`, `push.service.ts`. Per-device opt-in in Settings, independent of the email digest. The daily cron fans out "N words due" pushes; click → `/review`. Dead endpoints (404/410) pruned on send. Skipped entirely when VAPID keys are absent. |
| **UX consistency pass** | `accent` button variant (replaced 10+ hand-rolled teal CTAs); shared `PageHeader`, `EmptyState`, `StatusBadge`; sidebar grouped Learn/Library/Analyze; first-run dashboard hero for empty accounts; dead `ComingSoon` deleted. |
| **Multi-sense definitions** | `senses jsonb` on `words` / `definition_cache`. See below — this fixed a real correctness bug. |

### The multi-sense fix (why it exists)

dictionaryapi.dev lists senses in **etymological**, not frequency, order. The old parser took the *first* definition it saw and separately harvested examples from *any* sense — so `flustered` returned the archaic **"to make hot and rosy, as with drinking"** paired with examples illustrating a completely different meaning.

Now: `collectSenses` flattens every (part-of-speech, definition, examples) triple; `rankSenses` scores them (**+10** carries a usage example — the dictionary only illustrates senses people actually use; **−20** tagged archaic/obsolete/dated/rare; **−2** otherwise parenthetically qualified; ties fall back to dictionary order). The primary sense **must carry its own examples**, so definition and examples always describe the same meaning. All senses are stored and rendered (`SenseList`), primary first. The LLM path likewise returns 1–3 common senses, modern first.

**Cache heals itself:** `definition-cache.lookup` treats a `dictionary` row with null `senses` as a *miss*, so stale pre-fix rows are refetched and overwritten (`write` is now an upsert). No cache wipe needed.

### Migrations

`drizzle/0006_pronunciation_push.sql` and `0007_multi_sense.sql` — **both already applied to prod.**

> ⚠️ **`pnpm db:push` is broken** — drizzle-kit 0.31 crashes introspecting CHECK constraints (`Cannot read properties of undefined (reading 'replace')`). Apply migration SQL directly with a small `postgres`-client node script instead.

### Env / deploy

`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` are in `.env.local` **and must be set on Vercel** (the public key is inlined at build time — a redeploy is required after adding it). VAPID is free; nothing in push costs money.

Vercel Hobby allows one cron/day, so `vercel.json` fires `0 14 * * *` — the per-user `digestHour` preference is therefore only honoured for users who chose 14:00 UTC. Hourly (`0 * * * *`) needs Pro.

### Known gaps

- **Integration tests are not runnable**: the Supabase `testing` project (`ufiizhzljxrntjeluuhv`) is **paused**, and restoring it is paywalled on the free plan. Either create a fresh free project and repoint `SUPABASE_TEST_DB_URL`, or skip. Unit tests (217), lint, typecheck and build all pass.
- Next feature the user wants: **speak-back** — record the user pronouncing a word and grade it (this session shipped listen-only).

---

## State as of 2026-06-10 (post final-review remediation)

### What's done

| Phase | Status | Notes |
|---|---|---|
| Docs (PRD, ARCHITECTURE, TECH_SPEC, ROADMAP, ADRs 0001–0007, SECURITY, RUNBOOK, CONTRIBUTING) | ✅ | reconciled to code in this pass |
| Phase 0 — Scaffold + auth + RLS + CI | ✅ | |
| Phase 1 — Domain (SM-2 + Word invariants) | ✅ | `ValidWord` brand now enforced on the save path |
| Phase 2 — Persistence (queries + services + RLS) | ✅ | |
| Phase 3 — Definition pipeline (dict + DeepSeek + cache + `/api/capture`) | ✅ | capture route now rate-limited |
| Phase 4 — Capture UI + dashboard + app shell + import | ✅ | dashboard stats are now **real** (streak/retention/week/sparkline) |
| Phase 5 — Review session (`/review`, `/api/review/due`, `/api/review/grade`) | ✅ | grade now enforces the due-date (`not_due` → 409) |
| Phase 6 — Word list / detail / search / edit / delete | ✅ | |
| Phase 7 — Insights (growth / retention / problem words) | ✅ | |
| Phase 8 — Settings, account deletion, JSON/CSV export, daily digest cron | ✅ | real `SettingsForm` + `DeleteAccountDialog`; `GET /api/export?format=json\|csv` (Anki → 501); `DELETE /api/account`; `GET`/`PATCH /api/preferences`; `GET`/`POST /api/cron/daily-digest` (Vercel Cron `0 14 * * *`) |
| **Beyond core:** `/algorithm` SM-2 lab, practice mode | ✅ | |

**168 unit tests green** *(217 as of 2026-07-14)*. `pnpm lint`, `pnpm typecheck` clean on a fresh checkout. Integration tests (`pnpm test:integ`) require a live Supabase test project — see the 2026-07-14 "Known gaps" above; that project is currently paused.

### What's NOT done yet

- **Phase 9** — Polish & launch (Lighthouse ≥ 95, SEO, OG, perf pass).
- **Anki `.apkg` export** — `GET /api/export?format=anki` currently returns 501 (not yet implemented); planned for Phase 9 or a dedicated pass.
- Sentry — removed in Phase 0 cleanup; not planned for MVP. All references purged from docs/config.
- Distributed rate limiting — current limiter is best-effort in-memory (per serverless instance); see `docs/SECURITY.md` §6. Upgrade to Upstash/Redis before heavy traffic.

> **⚠️ DATABASE_URL pooler host:** prod uses `aws-1-ap-southeast-1.pooler.supabase.com:6543` (transaction pooler). The aws-0 host returns `tenant/user not found`. Keep Vercel's `DATABASE_URL` on the aws-1 host.

---

## How to run locally

```bash
pnpm install
pnpm dev                       # http://localhost:3000
pnpm test:unit                 # ~1.5s, 131 tests
pnpm test:integ                # hits the Supabase test project
pnpm verify                    # lint + typecheck + unit + integration
```

`pnpm db:push` is unsupported over typical IPv6-restricted networks. Apply schema via the Supabase SQL Editor: `drizzle/0000_next_wallow.sql`, then `0001_rls.sql`, then `0002_views.sql` (optional analytics views), then `0003_user_preferences.sql` (Phase 8 preferences table + RLS).

---

## DB connection topology

| Var | Project | Pooler | Port | Used by |
|---|---|---|---|---|
| `DATABASE_URL` | prod | Transaction | 6543 | App runtime on Vercel |
| `SUPABASE_TEST_DB_URL` | test | Session | 5432 | `pnpm test:integ` |

---

## Next phase

**Phase 9 — Polish & launch** (`docs/ROADMAP.md` Phase 9):
- Lighthouse ≥ 95 on `/`, `/dashboard`, `/review`.
- SEO meta tags + OG image.
- Performance pass (bundle trim, preload hints).
- Anki `.apkg` export (currently returns 501 at `GET /api/export?format=anki`).
