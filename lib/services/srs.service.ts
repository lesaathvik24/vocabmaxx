import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { srsState, reviewLog } from '@/lib/db/schema'
import * as srsQ from '@/lib/db/queries/srs'
import { nextState, type SRSResult } from '@/lib/domain/srs'
import type { Grade } from '@/lib/domain/grade'
import type { WordWithSRS } from '@/lib/domain/word'
import { type Result, ok, err, type SRSError } from '@/lib/domain/errors'

export async function listDue(userId: string, asOf: Date = new Date()): Promise<WordWithSRS[]> {
    return srsQ.findDue(userId, asOf)
}

export async function recordReview(
    userId: string,
    wordId: string,
    grade: Grade,
    now: Date = new Date(),
): Promise<Result<SRSResult, SRSError>> {
    return db.transaction(async tx => {
        const [current] = await tx
            .select()
            .from(srsState)
            .where(and(eq(srsState.wordId, wordId), eq(srsState.userId, userId)))
            .for('update')
            .limit(1)

        if (!current) return err<SRSError>({ kind: 'word_not_found' })

        if (current.dueDate.getTime() > now.getTime()) {
            return err<SRSError>({ kind: 'not_due', nextDue: current.dueDate })
        }

        const result = nextState(
            {
                easeFactor: current.easeFactor,
                intervalDays: current.intervalDays,
                repetitions: current.repetitions,
            },
            grade,
            now,
        )

        await tx
            .update(srsState)
            .set({
                easeFactor: result.state.easeFactor,
                intervalDays: result.state.intervalDays,
                repetitions: result.state.repetitions,
                dueDate: result.dueDate,
                lastReviewedAt: now,
            })
            .where(and(eq(srsState.wordId, wordId), eq(srsState.userId, userId)))

        await tx.insert(reviewLog).values({ userId, wordId, grade, reviewedAt: now })

        return ok(result)
    })
}
