import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../client'
import { reviewLog } from '../schema'
import type { Grade } from '@/lib/domain/grade'

export interface AppendReviewInput {
    userId: string
    wordId: string
    grade: Grade
    reviewedAt?: Date
}

export async function append(input: AppendReviewInput): Promise<void> {
    await db.insert(reviewLog).values({
        userId: input.userId,
        wordId: input.wordId,
        grade: input.grade,
        reviewedAt: input.reviewedAt ?? new Date(),
    })
}

export async function listByUser(userId: string, limit = 100) {
    return db
        .select()
        .from(reviewLog)
        .where(eq(reviewLog.userId, userId))
        .orderBy(desc(reviewLog.reviewedAt))
        .limit(limit)
}

export async function listByWord(userId: string, wordId: string) {
    return db
        .select()
        .from(reviewLog)
        .where(and(eq(reviewLog.userId, userId), eq(reviewLog.wordId, wordId)))
        .orderBy(desc(reviewLog.reviewedAt))
}
