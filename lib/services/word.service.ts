import 'server-only'
import * as wordsQ from '@/lib/db/queries/words'
import * as srsQ from '@/lib/db/queries/srs'
import * as reviewLogQ from '@/lib/db/queries/review-log'
import { type Word, assertWordFields, createWord } from '@/lib/domain/word'
import type { Grade } from '@/lib/domain/grade'
import { type Result, ok, err, type CaptureError } from '@/lib/domain/errors'
import { repsToStatus, type WordStatus } from '@/lib/words/filter'

export interface SaveWordInput {
    userId: string
    term: string
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
}

export async function save(input: SaveWordInput): Promise<Result<Word, CaptureError>> {
    let fields: { term: string; definition: string; examples: string[] }
    try {
        fields = assertWordFields(input)
    } catch {
        return err({ kind: 'invalid_term' })
    }

    // Fast-path: report the common case (already captured) without an insert attempt.
    const existing = await wordsQ.findByUserAndTerm(input.userId, fields.term)
    if (existing) return err({ kind: 'duplicate_term' })

    // Race-safe insert: a concurrent duplicate that slips past the check above
    // hits the unique index and returns null rather than throwing a 500.
    const inserted = await wordsQ.insertIfAbsent({
        userId: input.userId,
        term: fields.term,
        definition: fields.definition,
        examples: fields.examples,
        source: input.source,
    })
    if (!inserted) return err({ kind: 'duplicate_term' })

    await srsQ.initialize(inserted.id, input.userId)
    return ok(createWord(inserted))
}

export async function listForUser(userId: string): Promise<Word[]> {
    return wordsQ.listByUser(userId)
}

export interface WordWithStatus extends Word {
    status: WordStatus
    due: boolean
}

/**
 * List a user's words with derived SRS status (new/learning/review/mastered) and a
 * `due` flag (due date at or before `now`), for the word-list page filters.
 */
export async function listWithStatus(
    userId: string,
    now: Date = new Date(),
): Promise<WordWithStatus[]> {
    const rows = await wordsQ.listWithSrsByUser(userId)
    return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        term: r.term,
        definition: r.definition,
        examples: r.examples,
        source: r.source,
        addedAt: r.addedAt,
        status: repsToStatus(r.repetitions),
        due: r.dueDate.getTime() <= now.getTime(),
    }))
}

export interface WordReviewEntry {
    grade: Grade
    reviewedAt: Date
}

export interface WordDetail {
    word: Word
    status: WordStatus
    due: boolean
    srs: {
        easeFactor: number
        intervalDays: number
        repetitions: number
        dueDate: Date
        lastReviewedAt: Date | null
    } | null
    history: WordReviewEntry[]
}

/**
 * Full detail for one word owned by `userId`: the word, its SRS state + derived
 * status, and its review history (most recent first). Null when not found / not owner.
 */
export async function getDetail(
    id: string,
    userId: string,
    now: Date = new Date(),
): Promise<WordDetail | null> {
    const word = await wordsQ.findByIdForUser(id, userId)
    if (!word) return null

    const [srs, history] = await Promise.all([
        srsQ.getByWordId(id),
        reviewLogQ.listByWord(userId, id),
    ])

    return {
        word,
        status: repsToStatus(srs?.repetitions ?? 0),
        due: srs ? srs.dueDate.getTime() <= now.getTime() : true,
        srs: srs
            ? {
                  easeFactor: srs.easeFactor,
                  intervalDays: srs.intervalDays,
                  repetitions: srs.repetitions,
                  dueDate: srs.dueDate,
                  lastReviewedAt: srs.lastReviewedAt,
              }
            : null,
        history: history.map((h) => ({ grade: h.grade as Grade, reviewedAt: h.reviewedAt })),
    }
}

export type UpdateWordError = { kind: 'word_not_found' } | { kind: 'invalid_word' }

/**
 * Update a word's definition / examples (owner-scoped). Validates that examples,
 * when provided, are 1-3 non-empty strings and definition is non-empty.
 */
export async function update(
    id: string,
    userId: string,
    fields: { definition?: string; examples?: string[] },
): Promise<Result<Word, UpdateWordError>> {
    const patch: { definition?: string; examples?: string[] } = {}

    if (fields.definition !== undefined) {
        const def = fields.definition.trim()
        if (def.length === 0) return err({ kind: 'invalid_word' })
        patch.definition = def
    }

    if (fields.examples !== undefined) {
        const cleaned = fields.examples.map((e) => e.trim()).filter((e) => e.length > 0)
        if (cleaned.length < 1 || cleaned.length > 3) return err({ kind: 'invalid_word' })
        patch.examples = cleaned
    }

    const updated = await wordsQ.updateForUser(id, userId, patch)
    if (!updated) return err({ kind: 'word_not_found' })
    return ok(updated)
}

/**
 * Remove a word owned by `userId`. Returns true if a row was deleted, false if
 * the word does not exist or belongs to someone else.
 */
export async function remove(id: string, userId: string): Promise<boolean> {
    return wordsQ.deleteByIdForUser(id, userId)
}
