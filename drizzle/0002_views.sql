-- Phase 7 analytics views (OPTIONAL — not required for the app to work).
--
-- The application computes insights in-app via `lib/db/queries/analytics.ts`
-- (plain aggregation over `words` / `review_log`), so it works on Vercel with no
-- manual migration. These views exist for parity with docs/TECH_SPEC §4 and for
-- direct SQL / BI access. Apply by pasting into the Supabase SQL editor.
--
-- `security_invoker = true` makes the views honour the querying user's RLS
-- policies (Postgres 15+/Supabase), so they are safe to expose via the API.

-- Cumulative vocabulary size per user, per day a word was captured.
create or replace view vocab_growth_daily
with (security_invoker = true) as
select
    user_id,
    date_trunc('day', added_at)::date as day,
    count(*) as added,
    sum(count(*)) over (
        partition by user_id
        order by date_trunc('day', added_at)
    ) as cumulative
from words
group by user_id, date_trunc('day', added_at);

-- 30-day retention per user: share of reviews graded a pass (grade >= 3).
create or replace view retention_30d
with (security_invoker = true) as
select
    user_id,
    count(*) as total_reviews,
    coalesce(sum(case when grade >= 3 then 1 else 0 end), 0) as passed_reviews,
    case
        when count(*) = 0 then 0
        else coalesce(sum(case when grade >= 3 then 1 else 0 end), 0)::float / count(*)
    end as retention
from review_log
where reviewed_at >= now() - interval '30 days'
group by user_id;

-- Words ranked by lapse count (grade 0 = "Again"); zero-lapse words excluded.
create or replace view top_failed_words
with (security_invoker = true) as
select
    w.id as word_id,
    w.user_id,
    w.term,
    w.definition,
    coalesce(sum(case when rl.grade = 0 then 1 else 0 end), 0) as lapses,
    count(rl.id) as reviews,
    max(rl.reviewed_at) as last_reviewed_at
from words w
join review_log rl on rl.word_id = w.id
group by w.id, w.user_id, w.term, w.definition
having sum(case when rl.grade = 0 then 1 else 0 end) > 0;
