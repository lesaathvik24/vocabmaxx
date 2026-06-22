-- Enforce at most one ACTIVE sidequest per user, at the DB level.
-- The spawn path (lib/services/sidequest.service.ts) does a read-then-insert
-- ("no active? → create one"). Two concurrent renders (double-click, two tabs,
-- bf-cache) could both read null and both insert, creating duplicate active
-- quests and double-charging the LLM scenario call. This partial unique index
-- makes the second insert conflict; the service catches it and re-reads.
--
-- HOW TO APPLY: Supabase Dashboard → SQL Editor → paste → Run. Idempotent.

CREATE UNIQUE INDEX IF NOT EXISTS "sidequests_one_active_per_user"
    ON "sidequests" ("user_id")
    WHERE "status" = 'active';
