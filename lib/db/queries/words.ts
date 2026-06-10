import 'server-only'
import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '../client'
import { words } from '../schema'
import type { Word } from '@/lib/domain/word'

export interface InsertWordInput {
    userId: string
    term: string
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
}

export async function insert(input: InsertWordInput): Promise<Word> {
    const [row] = await db
        .insert(words)
        .values({
            userId: input.userId,
            term: input.term,
            definition: input.definition,
            examples: input.examples,
            source: input.source,
        })
        .returning()
    return rowToWord(row)
}

export async function findById(id: string): Promise<Word | null> {
    const [row] = await db.select().from(words).where(eq(words.id, id)).limit(1)
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

export async function countByUser(userId: string): Promise<number> {
    const [row] = await db.select({ value: count() }).from(words).where(eq(words.userId, userId))
    return row?.value ?? 0
}

export async function deleteById(id: string): Promise<void> {
    await db.delete(words).where(eq(words.id, id))
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
        addedAt: r.addedAt,
    }
}
