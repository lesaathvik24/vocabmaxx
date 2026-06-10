import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import * as wordsQ from '@/lib/db/queries/words'
import * as srsQ from '@/lib/db/queries/srs'
import * as reviewLogQ from '@/lib/db/queries/review-log'
import * as srsService from '@/lib/services/srs.service'
import { Grade } from '@/lib/domain/grade'
import { createAuthUser, cleanup, closeRaw, raw } from './_helpers'

const USER_R = '55555555-5555-4555-8555-eeeeeeeeeeee'

beforeAll(async () => {
    await createAuthUser(USER_R, 'race@test.vocabmaxx.local')
})

afterAll(async () => {
    await cleanup([USER_R])
    await closeRaw()
})

beforeEach(async () => {
    await raw`delete from words where user_id = ${USER_R}::uuid`
})

describe('concurrent grade race', () => {
    it('two simultaneous grades serialize: both logged, state advanced exactly twice', async () => {
        const w = await wordsQ.insert({
            userId: USER_R,
            term: 'race',
            definition: 'd',
            examples: ['e'],
            source: 'dictionary',
        })
        await srsQ.initialize(w.id, USER_R)

        const now = new Date()
        const [r1, r2] = await Promise.all([
            srsService.recordReview(USER_R, w.id, Grade.Good, now),
            srsService.recordReview(USER_R, w.id, Grade.Good, now),
        ])

        expect(r1.ok).toBe(true)
        expect(r2.ok).toBe(true)

        const logs = await reviewLogQ.listByWord(USER_R, w.id)
        expect(logs).toHaveLength(2)

        const state = await srsQ.getByWordId(w.id)
        // SELECT FOR UPDATE serializes the transactions: the second review sees
        // reps=1 and applies the reps=2 → 6-day interval, never a lost update.
        expect(state!.repetitions).toBe(2)
        expect(state!.intervalDays).toBe(6)
    })

    it('grading another user\'s word fails with word_not_found', async () => {
        const OTHER = '66666666-6666-4666-8666-666666666666'
        await createAuthUser(OTHER, 'race-other@test.vocabmaxx.local')
        try {
            const w = await wordsQ.insert({
                userId: USER_R,
                term: 'mine',
                definition: 'd',
                examples: ['e'],
                source: 'dictionary',
            })
            await srsQ.initialize(w.id, USER_R)

            const result = await srsService.recordReview(OTHER, w.id, Grade.Good, new Date())
            expect(result.ok).toBe(false)
            if (!result.ok) expect(result.error.kind).toBe('word_not_found')
        } finally {
            await cleanup([OTHER])
        }
    })
})
