import 'server-only'
import { and, asc, count, desc, eq, lte, ne, sql } from 'drizzle-orm'
import { db } from '../client'
import { sidequests, words, srsState } from '../schema'
import type { Sidequest, SidequestChannel, SidequestStats } from '@/lib/domain/sidequest'

type SidequestRow = typeof sidequests.$inferSelect

function rowToSidequest(r: SidequestRow): Sidequest {
    return {
        id: r.id,
        userId: r.userId,
        wordId: r.wordId,
        term: r.term,
        definition: r.definition,
        scenario: r.scenario,
        channel: r.channel,
        status: r.status,
        submission: r.submission,
        verdictReason: r.verdictReason,
        xpAwarded: r.xpAwarded,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        completedAt: r.completedAt,
    }
}

export async function getActive(userId: string): Promise<Sidequest | null> {
    const [row] = await db
        .select()
        .from(sidequests)
        .where(and(eq(sidequests.userId, userId), eq(sidequests.status, 'active')))
        .limit(1)
    return row ? rowToSidequest(row) : null
}

export async function getByIdForUser(id: string, userId: string): Promise<Sidequest | null> {
    const [row] = await db
        .select()
        .from(sidequests)
        .where(and(eq(sidequests.id, id), eq(sidequests.userId, userId)))
        .limit(1)
    return row ? rowToSidequest(row) : null
}

export async function listMissed(userId: string): Promise<Sidequest[]> {
    const rows = await db
        .select()
        .from(sidequests)
        .where(and(eq(sidequests.userId, userId), eq(sidequests.status, 'missed')))
        .orderBy(desc(sidequests.expiresAt))
    return rows.map(rowToSidequest)
}

export async function getStats(userId: string): Promise<SidequestStats> {
    const [row] = await db
        .select({
            xp: sql<number>`coalesce(sum(${sidequests.xpAwarded}) filter (where ${sidequests.status} = 'completed'), 0)`,
            completed: sql<number>`count(*) filter (where ${sidequests.status} = 'completed')`,
            missed: sql<number>`count(*) filter (where ${sidequests.status} = 'missed')`,
        })
        .from(sidequests)
        .where(eq(sidequests.userId, userId))
    return {
        xp: Number(row?.xp ?? 0),
        completed: Number(row?.completed ?? 0),
        missed: Number(row?.missed ?? 0),
    }
}

export interface InsertSidequestInput {
    userId: string
    wordId: string
    term: string
    definition: string
    scenario: string
    channel: SidequestChannel
    expiresAt: Date
}

/**
 * Insert a new active quest. Returns null when the partial unique index
 * (`sidequests_one_active_per_user`) rejects it — i.e. a concurrent render
 * already spawned one. Callers should re-read the active quest in that case.
 */
export async function insertActive(input: InsertSidequestInput): Promise<Sidequest | null> {
    const [row] = await db
        .insert(sidequests)
        .values({ ...input, status: 'active' })
        .onConflictDoNothing()
        .returning()
    return row ? rowToSidequest(row) : null
}

/**
 * Flip any of a user's active-but-overdue quests to 'missed'. Returns the number
 * of quests that just expired so the UI can surface a "couldn't be completed"
 * toast. This is the lazy replacement for a background expiry cron.
 */
export async function expireStale(userId: string, now: Date): Promise<number> {
    // `lte` matches the domain `isExpired` predicate (now >= expiresAt) exactly,
    // so a quest is never simultaneously "active in the DB" yet "expired" in logic.
    const rows = await db
        .update(sidequests)
        .set({ status: 'missed' })
        .where(
            and(
                eq(sidequests.userId, userId),
                eq(sidequests.status, 'active'),
                lte(sidequests.expiresAt, now),
            ),
        )
        .returning({ id: sidequests.id })
    return rows.length
}

/**
 * Atomically complete a quest. The `status <> 'completed'` guard makes this a
 * compare-and-set: a concurrent double-submit lands only once. Returns true when
 * this call is the one that completed it, false when it was already completed.
 */
export async function markCompleted(
    id: string,
    userId: string,
    fields: { xp: number; submission: string; reason: string; completedAt: Date },
): Promise<boolean> {
    const rows = await db
        .update(sidequests)
        .set({
            status: 'completed',
            xpAwarded: fields.xp,
            submission: fields.submission,
            verdictReason: fields.reason,
            completedAt: fields.completedAt,
        })
        .where(
            and(
                eq(sidequests.id, id),
                eq(sidequests.userId, userId),
                ne(sidequests.status, 'completed'),
            ),
        )
        .returning({ id: sidequests.id })
    return rows.length > 0
}

export async function recordVerdict(
    id: string,
    userId: string,
    fields: { submission: string; reason: string },
): Promise<void> {
    await db
        .update(sidequests)
        .set({ submission: fields.submission, verdictReason: fields.reason })
        .where(and(eq(sidequests.id, id), eq(sidequests.userId, userId)))
}

export async function countWords(userId: string): Promise<number> {
    const [row] = await db.select({ value: count() }).from(words).where(eq(words.userId, userId))
    return row?.value ?? 0
}

/**
 * Pick the next word to turn into a quest: the user's own words, biased toward
 * the most overdue / hardest to recall (earliest dueDate, then lowest ease
 * factor). Excludes `excludeWordId` so the same word never spawns back-to-back.
 */
export async function pickNextWord(
    userId: string,
    excludeWordId?: string,
): Promise<{ id: string; term: string; definition: string } | null> {
    const conds = [eq(words.userId, userId)]
    if (excludeWordId) conds.push(ne(words.id, excludeWordId))

    const [row] = await db
        .select({ id: words.id, term: words.term, definition: words.definition })
        .from(words)
        .leftJoin(srsState, eq(srsState.wordId, words.id))
        .where(and(...conds))
        .orderBy(asc(srsState.dueDate), asc(srsState.easeFactor))
        .limit(1)
    return row ?? null
}
