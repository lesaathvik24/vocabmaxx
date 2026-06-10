import 'server-only'
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { db } from '../client'
import { words, reviewLog } from '../schema'

/** Number of words a user had captured strictly before `since` (growth baseline). */
export async function countWordsBefore(userId: string, since: Date): Promise<number> {
    const [row] = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(words)
        .where(and(eq(words.userId, userId), lt(words.addedAt, since)))
    return row?.value ?? 0
}

export interface DailyCount {
    day: string // 'YYYY-MM-DD'
    added: number
}

/** Words added per calendar day (UTC) on or after `since`, ascending. */
export async function dailyAddedCounts(userId: string, since: Date): Promise<DailyCount[]> {
    return db
        .select({
            day: sql<string>`to_char(date_trunc('day', ${words.addedAt}), 'YYYY-MM-DD')`,
            added: sql<number>`count(*)::int`,
        })
        .from(words)
        .where(and(eq(words.userId, userId), gte(words.addedAt, since)))
        .groupBy(sql`date_trunc('day', ${words.addedAt})`)
        .orderBy(sql`date_trunc('day', ${words.addedAt})`)
}

export interface ReviewOutcomes {
    total: number
    passed: number // grade >= 3
}

/** Total reviews and "pass" (grade >= 3) reviews on or after `since`. */
export async function reviewOutcomes(userId: string, since: Date): Promise<ReviewOutcomes> {
    const [row] = await db
        .select({
            total: sql<number>`count(*)::int`,
            passed: sql<number>`coalesce(sum(case when ${reviewLog.grade} >= 3 then 1 else 0 end), 0)::int`,
        })
        .from(reviewLog)
        .where(and(eq(reviewLog.userId, userId), gte(reviewLog.reviewedAt, since)))
    return { total: row?.total ?? 0, passed: row?.passed ?? 0 }
}

export interface FailedWordRow {
    id: string
    term: string
    definition: string
    lapses: number // count of grade = 0 (Again)
    reviews: number // total reviews
    lastReviewedAt: Date | null
}

/** Words with the most lapses (grade 0), most-failed first. */
export async function topFailedWords(userId: string, limit: number): Promise<FailedWordRow[]> {
    const lapseExpr = sql<number>`coalesce(sum(case when ${reviewLog.grade} = 0 then 1 else 0 end), 0)::int`
    return db
        .select({
            id: words.id,
            term: words.term,
            definition: words.definition,
            lapses: lapseExpr,
            reviews: sql<number>`count(${reviewLog.id})::int`,
            lastReviewedAt: sql<Date | null>`max(${reviewLog.reviewedAt})`,
        })
        .from(words)
        .innerJoin(reviewLog, eq(reviewLog.wordId, words.id))
        .where(eq(words.userId, userId))
        .groupBy(words.id, words.term, words.definition)
        .having(sql`sum(case when ${reviewLog.grade} = 0 then 1 else 0 end) > 0`)
        .orderBy(desc(lapseExpr))
        .limit(limit)
}
