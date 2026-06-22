-- Sidequests: real-life usage missions for a user's own captured words.
-- One active quest at a time (lazy-spawned, 10h personal deadline); missed
-- quests linger as a reduced-XP redemption backlog. DeepSeek judges the
-- submitted sentence (tick/cross). XP and completed/missed counts are derived.
--
-- HOW TO APPLY (the `db:push` path fails over IPv6 from some networks):
--   Supabase Dashboard → SQL Editor → paste this whole file → Run.
-- It is idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS), so re-running is safe.

DO $$ BEGIN
    CREATE TYPE "public"."sidequest_status" AS ENUM('active', 'completed', 'missed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."sidequest_channel" AS ENUM('irl', 'text');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "sidequests" (
    "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"        uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "word_id"        uuid NOT NULL REFERENCES "public"."words"("id") ON DELETE CASCADE,
    "term"           text NOT NULL,
    "definition"     text NOT NULL,
    "scenario"       text NOT NULL,
    "channel"        "sidequest_channel" NOT NULL,
    "status"         "sidequest_status" NOT NULL DEFAULT 'active',
    "submission"     text,
    "verdict_reason" text,
    "xp_awarded"     integer NOT NULL DEFAULT 0,
    "created_at"     timestamptz NOT NULL DEFAULT now(),
    "expires_at"     timestamptz NOT NULL,
    "completed_at"   timestamptz
);

CREATE INDEX IF NOT EXISTS "sidequests_user_status_idx"
    ON "sidequests" USING btree ("user_id", "status");

-- Row-level security: defense-in-depth only. The app connects via Drizzle using a
-- raw DATABASE_URL role that is the table owner and never sets auth.uid(), so this
-- policy does NOT gate the live query path — every query in lib/db/queries/sidequests.ts
-- scopes by user_id in application code, which is the real boundary. This mirrors the
-- app-wide pattern (drizzle/0001_rls.sql) and protects only if a session-scoped
-- Supabase client ever queries this table directly.
ALTER TABLE "sidequests" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS owner_all ON "sidequests";
CREATE POLICY owner_all ON "sidequests"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
