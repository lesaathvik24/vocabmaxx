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
| Sentry | sentry.io/organizations/lesaathvik/issues/ | Errors, traces |
| PostHog | app.posthog.com/project/<id> | Product analytics |
| Resend | resend.com/emails | Transactional email |
| DeepSeek | platform.deepseek.com | LLM key management |
| GitHub | github.com/lesaathvik24/vocabmaxx-saas | Source + CI |

## 2. Deploys

### 2.1 Normal deploy

Merge a PR to `main`. Vercel auto-deploys. No action required.

### 2.2 Verifying a deploy

After Vercel reports "Ready":

1. Open vocabmaxx.com.
2. Sign in.
3. Add one word.
4. Review one card.
5. Check Sentry for the last 10 minutes — no new issues.

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

CI on `main` runs `pnpm db:migrate` against the Supabase prod URL using `SUPABASE_DB_URL_PROD` secret.

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
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET`
- `SENTRY_DSN`

### 4.3 Rotating a key

1. Generate new key in the provider's dashboard.
2. Add the new value to Vercel; trigger a redeploy.
3. Verify per §2.2.
4. Revoke the old key in the provider's dashboard.

## 5. Monitoring

### 5.1 Daily check (1 min)

- Sentry: any new issues in the last 24h?
- PostHog: capture/review event rate normal?
- Vercel: any failed cron runs?

If anything looks off, check the relevant dashboard linked in §1.

### 5.2 Weekly check (5 min)

- Supabase storage usage — heading toward the free-tier 500MB limit?
- Anthropic spend — under the personal budget?
- Resend emails sent vs. failures.

### 5.3 Sentry alert routing

Set up in Sentry → Alerts:

| Condition | Action |
|---|---|
| Error rate > 5/min for 5 min | Email + Slack DM |
| New issue (first seen in last hour) | Email |
| Performance: P95 > 5s for 10 min | Email |

## 6. Incident response

### 6.1 Severity definitions

| Severity | Example | SLA |
|---|---|---|
| SEV1 | Site is down | Respond in < 15 min |
| SEV2 | Auth broken; capture broken for all users | Respond in < 1 hour |
| SEV3 | Feature broken for some users; UI glitch | Next business day |

### 6.2 Procedure

1. **Acknowledge.** Comment on the alerting issue (Sentry / GitHub) within the SLA.
2. **Contain.** Roll back the most recent deploy (§2.3). Rotate any suspected-leaked secret (§4.3).
3. **Communicate.** If users are affected, post status to vocabmaxx.com/status (a static page).
4. **Eradicate.** Root-cause the bug. Write a failing test. Fix. Deploy.
5. **Postmortem.** Within 48h of recovery, write an ADR documenting cause + fix. Add a checklist item to prevent recurrence.

### 6.3 Common incidents

**Sentry shows `Network failure` on `/api/capture`:**
1. Check Anthropic status page.
2. If Anthropic is down, capture still works for dict-hits; LLM fallback throws expected error. Users see "couldn't generate definition for rare word."
3. No action needed unless Anthropic is down > 2h.

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

## 7. Daily-digest cron

Schedule defined in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/daily-digest", "schedule": "0 14 * * *" }
  ]
}
```

(14:00 UTC = 19:30 IST = user's deep-work window.)

### 7.1 Cron monitoring

Vercel logs cron invocations under Deployments → Functions → `/api/cron/daily-digest`. Failures are visible there.

### 7.2 Manual fire

```bash
curl -X POST https://vocabmaxx.com/api/cron/daily-digest \
    -H "Authorization: Bearer $CRON_SECRET"
```

Useful for testing email rendering changes.

## 8. Account management

### 8.1 Deleting your own account

In-app: Settings → Delete account → confirm. Triggers `delete from auth.users where id = auth.uid()`; cascades through all domain tables.

### 8.2 Manual user deletion (operator)

```sql
delete from auth.users where email = 'user@example.com';
```

## 9. Cost monitoring

Each month, review:

- **Supabase:** project usage. Target: stay free.
- **Vercel:** bandwidth + function invocations. Target: stay hobby-tier.
- **Anthropic:** API spend. Soft cap $10/month for personal use.
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
