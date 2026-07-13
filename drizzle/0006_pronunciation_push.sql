-- Pronunciation metadata + web-push subscriptions.
-- Applied via `pnpm db:push`; kept here for the audit trail like 0001-0005.

ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "phonetic" text;
ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "audio_url" text;
ALTER TABLE "definition_cache" ADD COLUMN IF NOT EXISTS "phonetic" text;
ALTER TABLE "definition_cache" ADD COLUMN IF NOT EXISTS "audio_url" text;

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE cascade,
    "endpoint" text NOT NULL,
    "p256dh" text NOT NULL,
    "auth" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" ("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" ("user_id");

-- RLS: same owner_all posture as the other user-owned tables (0001_rls.sql).
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_all ON "push_subscriptions"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
