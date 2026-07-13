import 'server-only'
import { and, asc, count, eq, lte } from 'drizzle-orm'
import { db } from '../client'
import { srsState, words } from '../schema'
import type { WordWithSRS } from '@/lib/domain/word'

export async function initialize(wordId: string, userId: string, now: Date = new Date()): Promise<void> {
    await db.insert(srsState).values({
        wordId,
        userId,
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
        dueDate: now,
    })
}

export async function getByWordId(wordId: string) {
    const [row] = await db.select().from(srsState).where(eq(srsState.wordId, wordId)).limit(1)
    return row ?? null
}

export async function countDue(userId: string, asOf: Date): Promise<number> {
    const [row] = await db
        .select({ value: count() })
        .from(srsState)
        .where(and(eq(srsState.userId, userId), lte(srsState.dueDate, asOf)))
    return row?.value ?? 0
}

export async function findDue(userId: string, asOf: Date): Promise<WordWithSRS[]> {
    const rows = await db
        .select()
        .from(words)
        .innerJoin(srsState, eq(srsState.wordId, words.id))
        .where(and(eq(words.userId, userId), lte(srsState.dueDate, asOf)))
        .orderBy(asc(srsState.dueDate))

    return rows.map(({ words: w, srs_state: s }) => ({
        id: w.id,
        userId: w.userId,
        term: w.term,
        definition: w.definition,
        examples: w.examples,
        source: w.source,
        phonetic: w.phonetic,
        audioUrl: w.audioUrl,
        senses: w.senses,
        addedAt: w.addedAt,
        srs: {
            easeFactor: s.easeFactor,
            intervalDays: s.intervalDays,
            repetitions: s.repetitions,
            dueDate: s.dueDate,
            lastReviewedAt: s.lastReviewedAt,
        },
    }))
}
