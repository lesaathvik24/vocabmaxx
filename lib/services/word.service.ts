import 'server-only'
import * as wordsQ from '@/lib/db/queries/words'
import * as srsQ from '@/lib/db/queries/srs'
import type { Word } from '@/lib/domain/word'
import { type Result, ok, err, type CaptureError } from '@/lib/domain/errors'

export interface SaveWordInput {
    userId: string
    term: string
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
}

export async function save(input: SaveWordInput): Promise<Result<Word, CaptureError>> {
    const normalisedTerm = input.term.trim().toLowerCase()
    if (!normalisedTerm) return err({ kind: 'invalid_term' })

    const existing = await wordsQ.findByUserAndTerm(input.userId, normalisedTerm)
    if (existing) return err({ kind: 'duplicate_term' })

    const word = await wordsQ.insert({ ...input, term: normalisedTerm })
    await srsQ.initialize(word.id, input.userId)
    return ok(word)
}

export async function listForUser(userId: string): Promise<Word[]> {
    return wordsQ.listByUser(userId)
}

export async function getById(id: string): Promise<Word | null> {
    return wordsQ.findById(id)
}

/**
 * Remove a word owned by `userId`. Returns true if a row was deleted, false if
 * the word does not exist or belongs to someone else.
 */
export async function remove(id: string, userId: string): Promise<boolean> {
    return wordsQ.deleteByIdForUser(id, userId)
}
