-- Multi-sense definitions: every meaning of a word, primary first.
-- Applied via node (drizzle-kit push crashes on CHECK introspection); kept here
-- for the audit trail like 0001-0006.
--
-- Purely additive. Stale dictionary rows in definition_cache (written by the old
-- single-sense parser, which could pair a definition with examples from a
-- different sense) are NOT deleted: `lookup` treats a dictionary row with a null
-- `senses` as a cache miss, so those rows are refetched and overwritten on next
-- use. The cache heals itself.

ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "senses" jsonb;
ALTER TABLE "definition_cache" ADD COLUMN IF NOT EXISTS "senses" jsonb;
