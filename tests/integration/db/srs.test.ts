import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import * as wordsQ from '@/lib/db/queries/words'
import * as srsQ from '@/lib/db/queries/srs'
import * as reviewLogQ from '@/lib/db/queries/review-log'
import * as srsService from '@/lib/services/srs.service'
import { Grade } from '@/lib/domain/grade'
import { createAuthUser, cleanup, closeRaw, raw } from './_helpers'

const USER_A = '22222222-2222-2222-2222-aaaaaaaaaaaa'

beforeAll(async () => {
    await createAuthUser(USER_A, 'a-srs@test.vocabmaxx.local')
})

afterAll(async () => {
    await cleanup([USER_A])
    await closeRaw()
})

beforeEach(async () => {
    await raw`delete from words where user_id = ${USER_A}::uuid`
})

describe('srs queries + service', () => {
    it('initialize creates a default srs_state row due now', async () => {
        const w = await wordsQ.insert({ userId: USER_A, term: 'init', definition: 'd', examples: ['e'], source: 'dictionary' })
        await srsQ.initialize(w.id, USER_A)
        const s = await srsQ.getByWordId(w.id)
        expect(s).not.toBeNull()
        expect(s!.easeFactor).toBe(2.5)
        expect(s!.repetitions).toBe(0)
    })

    it('findDue returns only rows with due_date <= asOf', async () => {
        const past = await wordsQ.insert({ userId: USER_A, term: 'past', definition: 'd', examples: ['e'], source: 'dictionary' })
        const future = await wordsQ.insert({ userId: USER_A, term: 'future', definition: 'd', examples: ['e'], source: 'dictionary' })
        await raw`insert into srs_state (word_id, user_id, due_date) values (${past.id}::uuid, ${USER_A}::uuid, now() - interval '1 day')`
        await raw`insert into srs_state (word_id, user_id, due_date) values (${future.id}::uuid, ${USER_A}::uuid, now() + interval '10 day')`

        const due = await srsQ.findDue(USER_A, new Date())
        expect(due).toHaveLength(1)
        expect(due[0].term).toBe('past')
    })

    it('recordReview updates state and appends a review_log in one transaction', async () => {
        const w = await wordsQ.insert({ userId: USER_A, term: 'tx', definition: 'd', examples: ['e'], source: 'dictionary' })
        // Initialise due before the grade time so the card is actually due when graded.
        await srsQ.initialize(w.id, USER_A, new Date('2024-05-01T00:00:00Z'))

        const now = new Date('2024-06-01T00:00:00Z')
        const result = await srsService.recordReview(USER_A, w.id, Grade.Good, now)
        expect(result.ok).toBe(true)

        const after = await srsQ.getByWordId(w.id)
        expect(after!.repetitions).toBe(1)
        expect(after!.intervalDays).toBe(1)
        expect(after!.lastReviewedAt?.toISOString()).toBe(now.toISOString())

        const logs = await reviewLogQ.listByWord(USER_A, w.id)
        expect(logs).toHaveLength(1)
        expect(logs[0].grade).toBe(Grade.Good)
    })

    it('recordReview returns word_not_found error when no srs row exists', async () => {
        const w = await wordsQ.insert({ userId: USER_A, term: 'orphan', definition: 'd', examples: ['e'], source: 'dictionary' })
        const result = await srsService.recordReview(USER_A, w.id, Grade.Good, new Date())
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error.kind).toBe('word_not_found')
    })
})
