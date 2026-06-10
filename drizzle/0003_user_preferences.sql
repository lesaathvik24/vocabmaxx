-- Phase 8: user_preferences (theme, profile, daily-digest notification prefs).
--
-- HOW TO APPLY (the `db:push` path fails over IPv6 from some networks):
--   Supabase Dashboard → SQL Editor → paste this whole file → Run.
-- It is idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS), so re-running is safe.

CREATE TABLE IF NOT EXISTS "user_preferences" (
    "user_id"      uuid PRIMARY KEY REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "display_name" text,
    "theme"        text NOT NULL DEFAULT 'dark',
    "daily_digest" boolean NOT NULL DEFAULT false,
    "digest_hour"  integer NOT NULL DEFAULT 14,
    "created_at"   timestamptz NOT NULL DEFAULT now(),
    "updated_at"   timestamptz NOT NULL DEFAULT now()
);

-- Row-level security: a user may only see/modify their own preferences row.
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS owner_all ON "user_preferences";
CREATE POLICY owner_all ON "user_preferences"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
