import 'server-only'
import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '../client'
import { words, srsState } from '../schema'
import type { Word } from '@/lib/domain/word'

export interface WordListRow extends Word {
    repetitions: number
    dueDate: Date
}

export interface InsertWordInput {
    userId: string
    term: string
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
    phonetic: string | null
    audioUrl: string | null
}

/**
 * Low-level insert. Throws on a `(user_id, term)` unique-index violation — use
 * `insertIfAbsent` for the user-facing capture path, which handles the race.
 */
export async function insert(input: InsertWordInput): Promise<Word> {
    const [row] = await db
        .insert(words)
        .values({
            userId: input.userId,
            term: input.term,
            definition: input.definition,
            examples: input.examples,
            source: input.source,
            phonetic: input.phonetic,
            audioUrl: input.audioUrl,
        })
        .returning()
    return rowToWord(row)
}

/**
 * Race-safe insert: a concurrent duplicate that hits the `(user_id, term)`
 * unique index returns `null` (via `onConflictDoNothing`) instead of throwing,
 * letting the capture path report a clean 409 instead of a 500.
 */
export async function insertIfAbsent(input: InsertWordInput): Promise<Word | null> {
    const [row] = await db
        .insert(words)
        .values({
            userId: input.userId,
            term: input.term,
            definition: input.definition,
            examples: input.examples,
            source: input.source,
            phonetic: input.phonetic,
            audioUrl: input.audioUrl,
        })
        .onConflictDoNothing({ target: [words.userId, words.term] })
        .returning()
    return row ? rowToWord(row) : null
}

export async function findByIdForUser(id: string, userId: string): Promise<Word | null> {
    const [row] = await db
        .select()
        .from(words)
        .where(and(eq(words.id, id), eq(words.userId, userId)))
        .limit(1)
    return row ? rowToWord(row) : null
}

export interface UpdateWordFields {
    definition?: string
    examples?: string[]
}

/**
 * Update a word's editable fields (definition / examples) only if it belongs to
 * the given user. Returns the updated word, or null when nothing matched.
 */
export async function updateForUser(
    id: string,
    userId: string,
    fields: UpdateWordFields,
): Promise<Word | null> {
    const patch: Partial<typeof words.$inferInsert> = {}
    if (fields.definition !== undefined) patch.definition = fields.definition
    if (fields.examples !== undefined) patch.examples = fields.examples
    if (Object.keys(patch).length === 0) {
        return findByIdForUser(id, userId)
    }

    const [row] = await db
        .update(words)
        .set(patch)
        .where(and(eq(words.id, id), eq(words.userId, userId)))
        .returning()
    return row ? rowToWord(row) : null
}

export async function findByUserAndTerm(userId: string, term: string): Promise<Word | null> {
    const [row] = await db
        .select()
        .from(words)
        .where(and(eq(words.userId, userId), eq(words.term, term)))
        .limit(1)
    return row ? rowToWord(row) : null
}

export async function listByUser(userId: string, opts?: { limit?: number }): Promise<Word[]> {
    const q = db
        .select()
        .from(words)
        .where(eq(words.userId, userId))
        .orderBy(desc(words.addedAt))
    const rows = opts?.limit ? await q.limit(opts.limit) : await q
    return rows.map(rowToWord)
}

/**
 * List a user's words joined with their SRS state (repetitions + due date) so the
 * word-list UI can derive status (new/learning/review/mastered) and the Due filter.
 * Left join so a word without an srs_state row still appears (treated as new/now-due).
 */
export async function listWithSrsByUser(
    userId: string,
    opts?: { limit?: number },
): Promise<WordListRow[]> {
    const base = db
        .select()
        .from(words)
        .leftJoin(srsState, eq(srsState.wordId, words.id))
        .where(eq(words.userId, userId))
        .orderBy(desc(words.addedAt))
    const rows = opts?.limit ? await base.limit(opts.limit) : await base

    return rows.map(({ words: w, srs_state: s }) => ({
        ...rowToWord(w),
        repetitions: s?.repetitions ?? 0,
        dueDate: s?.dueDate ?? w.addedAt,
    }))
}

export interface ExportRow extends Word {
    easeFactor: number | null
    intervalDays: number | null
    repetitions: number | null
    dueDate: Date | null
    lastReviewedAt: Date | null
}

/**
 * Every word a user owns, joined with its full SRS state, for data export.
 * Left join so words without an srs_state row still export (SRS fields null).
 */
export async function listForExport(userId: string): Promise<ExportRow[]> {
    const rows = await db
        .select()
        .from(words)
        .leftJoin(srsState, eq(srsState.wordId, words.id))
        .where(eq(words.userId, userId))
        .orderBy(desc(words.addedAt))

    return rows.map(({ words: w, srs_state: s }) => ({
        ...rowToWord(w),
        easeFactor: s?.easeFactor ?? null,
        intervalDays: s?.intervalDays ?? null,
        repetitions: s?.repetitions ?? null,
        dueDate: s?.dueDate ?? null,
        lastReviewedAt: s?.lastReviewedAt ?? null,
    }))
}

export async function countByUser(userId: string): Promise<number> {
    const [row] = await db.select({ value: count() }).from(words).where(eq(words.userId, userId))
    return row?.value ?? 0
}

/**
 * Delete a word only if it belongs to the given user. Returns true when a row
 * was actually removed, false when nothing matched (wrong owner or missing id).
 * SRS state + review log rows cascade via the FK `onDelete: 'cascade'`.
 */
export async function deleteByIdForUser(id: string, userId: string): Promise<boolean> {
    const deleted = await db
        .delete(words)
        .where(and(eq(words.id, id), eq(words.userId, userId)))
        .returning({ id: words.id })
    return deleted.length > 0
}

type WordRow = typeof words.$inferSelect
function rowToWord(r: WordRow): Word {
    return {
        id: r.id,
        userId: r.userId,
        term: r.term,
        definition: r.definition,
        examples: r.examples,
        source: r.source,
        phonetic: r.phonetic,
        audioUrl: r.audioUrl,
        addedAt: r.addedAt,
    }
}
