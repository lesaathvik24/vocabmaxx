-- Run this in Supabase → SQL Editor → New query
-- auth.users already exists — skip it, just create app tables

CREATE TYPE IF NOT EXISTS "public"."definition_source" AS ENUM('dictionary', 'llm');
CREATE TYPE IF NOT EXISTS "public"."import_job_status" AS ENUM('pending', 'running', 'done', 'failed');

CREATE TABLE IF NOT EXISTS "definition_cache" (
    "term" text PRIMARY KEY NOT NULL,
    "definition" text NOT NULL,
    "examples" jsonb NOT NULL,
    "source" "definition_source" NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "words" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "term" text NOT NULL,
    "definition" text NOT NULL,
    "examples" jsonb NOT NULL,
    "source" "definition_source" NOT NULL,
    "added_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "srs_state" (
    "word_id" uuid PRIMARY KEY REFERENCES "words"(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "ease_factor" double precision DEFAULT 2.5 NOT NULL,
    "interval_days" integer DEFAULT 0 NOT NULL,
    "repetitions" integer DEFAULT 0 NOT NULL,
    "due_date" timestamp with time zone DEFAULT now() NOT NULL,
    "last_reviewed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "review_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "word_id" uuid NOT NULL REFERENCES "words"(id) ON DELETE CASCADE,
    "grade" integer NOT NULL,
    "reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "import_jobs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "status" "import_job_status" DEFAULT 'pending' NOT NULL,
    "total_terms" integer NOT NULL,
    "added_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "words_user_term_idx" ON "words"("user_id", "term");
CREATE INDEX IF NOT EXISTS "words_user_idx" ON "words"("user_id");
CREATE INDEX IF NOT EXISTS "srs_due_idx" ON "srs_state"("user_id", "due_date");
CREATE INDEX IF NOT EXISTS "review_user_time_idx" ON "review_log"("user_id", "reviewed_at");

-- RLS
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS owner_all ON words
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS owner_all ON srs_state
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS owner_all ON review_log
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS owner_all ON import_jobs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS public_read ON definition_cache
    FOR SELECT USING (true);
