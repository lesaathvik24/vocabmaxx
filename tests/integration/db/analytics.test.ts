import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import * as analytics from '@/lib/db/queries/analytics'
import * as words from '@/lib/db/queries/words'
import { createAuthUser, cleanup, closeRaw, raw } from './_helpers'

const USER_A = '33333333-3333-3333-3333-aaaaaaaaaaaa'
const USER_B = '33333333-3333-3333-3333-bbbbbbbbbbbb'

async function seedWord(userId: string, term: string, addedAt: Date): Promise<string> {
    const w = await words.insert({ userId, term, definition: `${term} def`, examples: ['e'], source: 'dictionary', phonetic: null, audioUrl: null })
    await raw`update words set added_at = ${addedAt.toISOString()} where id = ${w.id}::uuid`
    return w.id
}

async function seedReview(userId: string, wordId: string, grade: number, at: Date): Promise<void> {
    await raw`insert into review_log (user_id, word_id, grade, reviewed_at)
              values (${userId}::uuid, ${wordId}::uuid, ${grade}, ${at.toISOString()})`
}

beforeAll(async () => {
    await createAuthUser(USER_A, 'a-analytics@test.vocabmaxx.local')
    await createAuthUser(USER_B, 'b-analytics@test.vocabmaxx.local')
})

afterAll(async () => {
    await cleanup([USER_A, USER_B])
    await closeRaw()
})

beforeEach(async () => {
    await raw`delete from words where user_id = any(${[USER_A, USER_B]}::uuid[])`
})

describe('analytics queries', () => {
    it('dailyAddedCounts + countWordsBefore drive cumulative growth', async () => {
        const since = new Date('2026-06-01T00:00:00Z')
        await seedWord(USER_A, 'old', new Date('2026-05-20T00:00:00Z')) // before window
        await seedWord(USER_A, 'w1', new Date('2026-06-02T10:00:00Z'))
        await seedWord(USER_A, 'w2', new Date('2026-06-02T11:00:00Z'))
        await seedWord(USER_A, 'w3', new Date('2026-06-05T09:00:00Z'))

        const baseline = await analytics.countWordsBefore(USER_A, since)
        const daily = await analytics.dailyAddedCounts(USER_A, since)

        expect(baseline).toBe(1)
        const byDay = Object.fromEntries(daily.map((d) => [d.day, d.added]))
        expect(byDay['2026-06-02']).toBe(2)
        expect(byDay['2026-06-05']).toBe(1)
    })

    it('reviewOutcomes counts total and passed (grade >= 3) in window', async () => {
        const since = new Date('2026-06-01T00:00:00Z')
        const id = await seedWord(USER_A, 'rev', new Date('2026-05-01T00:00:00Z'))
        await seedReview(USER_A, id, 0, new Date('2026-06-03T00:00:00Z')) // fail
        await seedReview(USER_A, id, 3, new Date('2026-06-04T00:00:00Z')) // pass
        await seedReview(USER_A, id, 5, new Date('2026-06-05T00:00:00Z')) // pass
        await seedReview(USER_A, id, 4, new Date('2026-05-01T00:00:00Z')) // before window — excluded

        const { total, passed } = await analytics.reviewOutcomes(USER_A, since)
        expect(total).toBe(3)
        expect(passed).toBe(2)
    })

    it('topFailedWords ranks by lapses (grade 0) and excludes zero-lapse words', async () => {
        const bad = await seedWord(USER_A, 'quixotic', new Date('2026-05-01T00:00:00Z'))
        const ok = await seedWord(USER_A, 'easy', new Date('2026-05-01T00:00:00Z'))
        await seedReview(USER_A, bad, 0, new Date('2026-06-01T00:00:00Z'))
        await seedReview(USER_A, bad, 0, new Date('2026-06-02T00:00:00Z'))
        await seedReview(USER_A, bad, 4, new Date('2026-06-03T00:00:00Z'))
        await seedReview(USER_A, ok, 5, new Date('2026-06-01T00:00:00Z'))

        const rows = await analytics.topFailedWords(USER_A, 10)
        expect(rows).toHaveLength(1)
        expect(rows[0].term).toBe('quixotic')
        expect(rows[0].lapses).toBe(2)
        expect(rows[0].reviews).toBe(3)
    })

    it('scopes everything to the owner', async () => {
        const since = new Date('2026-06-01T00:00:00Z')
        await seedWord(USER_B, 'other', new Date('2026-06-02T00:00:00Z'))
        const daily = await analytics.dailyAddedCounts(USER_A, since)
        expect(daily).toHaveLength(0)
    })
})
