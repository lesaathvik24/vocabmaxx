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
    const existing = await wordsQ.findByUserAndTerm(input.userId, input.term)
    if (existing) return err({ kind: 'duplicate_term' })

    const word = await wordsQ.insert(input)
    await srsQ.initialize(word.id, input.userId)
    return ok(word)
}

export async function listForUser(userId: string): Promise<Word[]> {
    return wordsQ.listByUser(userId)
}

export async function getById(id: string): Promise<Word | null> {
    return wordsQ.findById(id)
}

export async function remove(id: string): Promise<void> {
    await wordsQ.deleteById(id)
}
