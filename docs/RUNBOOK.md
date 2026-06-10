# Runbook — VocabMaxx

**Audience:** the human (you, or another engineer) operating this service.
**Scope:** deploys, rollbacks, migrations, monitoring, incidents.

> Keep this doc current. If a procedure here doesn't match reality, fix the doc in the same commit as the procedure change.

---

## 1. Service inventory

| Service | URL / dashboard | Purpose |
|---|---|---|
| Vercel | vercel.com/lesaathvik/vocabmaxx | App hosting + edge functions + Cron |
| Supabase | supabase.com/dashboard/project/<id> | Postgres + Auth |
| Vercel Logs | vercel.com/lesaathvik/vocabmaxx/logs | Runtime errors + function logs |
| PostHog | app.posthog.com/project/<id> | Product analytics |
| Resend | resend.com/emails | Transactional email |
| DeepSeek | platform.deepseek.com | LLM key management |
| GitHub | github.com/lesaathvik24/vocabmaxx | Source + CI |

## 2. Deploys

### 2.1 Normal deploy

Merge a PR to `main`. Vercel auto-deploys. No action required.

### 2.2 Verifying a deploy

After Vercel reports "Ready":

1. Open vocabmaxx.com.
2. Sign in.
3. Add one word.
4. Review one card.
5. Check Vercel Logs and PostHog for the last 10 minutes — no new errors or anomalies.

If any step fails, **roll back** (§2.3).

### 2.3 Rollback

```
1. vercel.com → Deployments → previous successful deploy → "Promote to Production"
2. Verify per §2.2.
3. Open a "Hotfix" issue describing what broke and why.
```

Rollback restores the app code. **It does NOT undo DB migrations.** If the bad deploy ran a migration, see §3.4.

### 2.4 Manual deploy from CLI (emergency only)

```bash
vercel --prod
```

Useful when GitHub Actions is down. Requires `vercel login` once.

## 3. Database

### 3.1 Migrations — applying

```bash
pnpm db:generate                    # creates drizzle/NNNN_<name>.sql
# review the generated SQL
pnpm db:push                        # applies to local
git add drizzle/ lib/db/schema.ts
git commit -m "feat(db): <change>"
```

CI does **not** run migrations automatically. Apply schema changes manually via the Supabase SQL Editor or `pnpm db:push` with network access to the DB. See §3.4 for rollback procedure.

### 3.2 Backups

- Supabase free tier: daily backups, 7-day retention.
- Manual export weekly during the first month after launch:
  ```bash
  supabase db dump --project-ref <id> --db-url $SUPABASE_DB_URL_PROD > backups/$(date +%Y-%m-%d).sql
  ```
- Keep backups outside the repo (encrypted in `~/Documents/vocabmaxx-backups/`).

### 3.3 Restore

```bash
psql $SUPABASE_DB_URL_PROD < backups/YYYY-MM-DD.sql
```

Run **only** during a maintenance window. Drops all newer data.

### 3.4 Rolling back a migration

Drizzle migrations are forward-only. To revert:

1. Write a new migration that undoes the previous one (drop the column, restore the constraint, etc.).
2. Apply it via §3.1.

**Never** edit a committed migration. Future engineers (and CI) assume migrations are immutable.

### 3.5 Common DB ops

**Promote a user to admin** (no admin concept in v1; placeholder for v2):
```sql
update profiles set role = 'admin' where id = '<uuid>';
```

**Wipe a user's data** (account deletion, GDPR-style request):
```sql
delete from auth.users where id = '<uuid>';
-- cascades through words, srs_state, review_log, import_jobs
```

**Force a re-cache of a definition**:
```sql
delete from definition_cache where term = 'ubiquitous';
```

## 4. Environment variables

### 4.1 Setting

In Vercel: Settings → Environment Variables. Scope to Production, Preview, and/or Development.

After changing an env var, **redeploy** — Vercel doesn't hot-reload them.

### 4.2 Required for production

See `.env.example` in the repo root. Without these, Vercel build fails:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY` (and optionally `DEEPSEEK_BASE_URL`)
- `RESEND_API_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_POSTHOG_KEY` (and optionally `NEXT_PUBLIC_POSTHOG_HOST`)

### 4.3 Rotating a key

1. Generate new key in the provider's dashboard.
2. Add the new value to Vercel; trigger a redeploy.
3. Verify per §2.2.
4. Revoke the old key in the provider's dashboard.

## 5. Monitoring

### 5.1 Daily check (1 min)

- Vercel Logs: any new errors in the last 24h?
- PostHog: capture/review event rate normal?
- Vercel: any failed function invocations?

If anything looks off, check the relevant dashboard linked in §1.

### 5.2 Weekly check (5 min)

- Supabase storage usage — heading toward the free-tier 500MB limit?
- DeepSeek spend — under the personal budget? (shared `definition_cache` should keep this near zero after the first dozen captures.)
- Resend emails sent vs. failures.

### 5.3 Alert routing

Currently no automated alerting is configured. Monitor via Vercel Logs and PostHog dashboards. Planned: set up Vercel log drains or PostHog webhooks for error-rate thresholds once error volume justifies it.

## 6. Incident response

### 6.1 Severity definitions

| Severity | Example | SLA |
|---|---|---|
| SEV1 | Site is down | Respond in < 15 min |
| SEV2 | Auth broken; capture broken for all users | Respond in < 1 hour |
| SEV3 | Feature broken for some users; UI glitch | Next business day |

### 6.2 Procedure

1. **Acknowledge.** Comment on the alerting issue (Vercel Logs / GitHub) within the SLA.
2. **Contain.** Roll back the most recent deploy (§2.3). Rotate any suspected-leaked secret (§4.3).
3. **Communicate.** If users are affected, post status to vocabmaxx.com/status (a static page).
4. **Eradicate.** Root-cause the bug. Write a failing test. Fix. Deploy.
5. **Postmortem.** Within 48h of recovery, write an ADR documenting cause + fix. Add a checklist item to prevent recurrence.

### 6.3 Common incidents

**Vercel Logs shows `Network failure` on `/api/capture`:**
1. Check DeepSeek status (https://status.deepseek.com).
2. If DeepSeek is down, capture still works for dict-hits; LLM fallback returns `network_failure` / `rate_limited`. Users see "couldn't generate definition for rare word."
3. No action needed unless DeepSeek is down > 2h. If it stays down, swap `DEEPSEEK_BASE_URL` to an OpenAI-compatible mirror (Together, Groq, OpenRouter) in Vercel and redeploy.

**Supabase shows "Connection limit exceeded":**
1. Drop the long-running queries from Supabase dashboard.
2. If recurring, check for a leaking connection pool in Drizzle config (`max` connections too high for serverless).

**Sign-in is broken:**
1. Check Supabase Auth dashboard for service status.
2. Try magic-link as a fallback (if Google OAuth is the broken one).
3. If both broken, roll back the last deploy that touched `lib/auth/`.

**Vercel build fails:**
1. Check the failing log — usually a TS error or missing env var.
2. If env var missing in Production scope, add it; redeploy.
3. If TS error, hotfix in `main` (after checking the offending PR is the cause).

## 7. Daily-digest cron (Phase 8 — not yet implemented)

The daily-digest cron and its route (`/api/cron/daily-digest`) are planned for Phase 8. The route does not exist in the current codebase.

When implemented, the planned schedule is:

```json
{
  "crons": [
    { "path": "/api/cron/daily-digest", "schedule": "0 14 * * *" }
  ]
}
```

(14:00 UTC = 19:30 IST.)

See [`ROADMAP.md`](ROADMAP.md) §8.3 for the implementation plan.

## 8. Account management

### 8.1 Deleting your own account

The in-app Settings → Delete account flow is planned for Phase 8 and does not yet exist. To delete your account now, use the operator SQL below (§8.2).

### 8.2 Manual user deletion (operator)

```sql
delete from auth.users where email = 'user@example.com';
```

## 9. Cost monitoring

Each month, review:

- **Supabase:** project usage. Target: stay free.
- **Vercel:** bandwidth + function invocations. Target: stay hobby-tier.
- **DeepSeek:** API spend. Soft cap $5/month for personal use — shared `definition_cache` makes blowing past this unlikely.
- **Resend:** emails sent. Free tier: 3,000/month.

If approaching any limit, see relevant ADR for upgrade considerations.

## 10. Disaster recovery

| Scenario | Recovery |
|---|---|
| Supabase project deleted | Restore from latest backup (§3.3) into a new project; update env vars; redeploy. |
| Vercel project deleted | Re-import from GitHub; reconfigure env vars (~15 min). |
| GitHub repo deleted | Local clones are the source of truth; push to a new repo. |
| Domain expired | Renew via registrar; propagate DNS. |

Maximum data loss tolerance: 24h (Supabase free-tier backup cadence).

---

**Cross-references**

- Why these services were chosen: [`ADR/`](ADR/).
- Security incidents specifically: [`SECURITY.md`](SECURITY.md) §15.
- Deploy gates set in CI: [`CONTRIBUTING.md`](CONTRIBUTING.md) §5.4.
