-- Enable RLS on all 5 app tables
ALTER TABLE "words" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "srs_state" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "import_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "definition_cache" ENABLE ROW LEVEL SECURITY;

-- User-scoped owner_all policies for the 4 user tables
CREATE POLICY owner_all ON "words"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY owner_all ON "srs_state"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY owner_all ON "review_log"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY owner_all ON "import_jobs"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- definition_cache: public SELECT only; writes are service-role only (bypasses RLS)
CREATE POLICY public_read ON "definition_cache"
    FOR SELECT USING (true);
