import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as wordsQ from '@/lib/db/queries/words'
import * as srsQ from '@/lib/db/queries/srs'
import { createAuthUser, cleanup, closeRaw, raw } from './_helpers'

const USER_A = '33333333-3333-3333-3333-aaaaaaaaaaaa'
const USER_B = '33333333-3333-3333-3333-bbbbbbbbbbbb'

beforeAll(async () => {
    await createAuthUser(USER_A, 'a-rls@test.vocabmaxx.local')
    await createAuthUser(USER_B, 'b-rls@test.vocabmaxx.local')
    await raw`delete from words where user_id = any(${[USER_A, USER_B]}::uuid[])`

    const a = await wordsQ.insert({ userId: USER_A, term: 'alpha', definition: 'a-def', examples: ['ex'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null })
    const b = await wordsQ.insert({ userId: USER_B, term: 'bravo', definition: 'b-def', examples: ['ex'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null })
    await srsQ.initialize(a.id, USER_A)
    await srsQ.initialize(b.id, USER_B)
    await raw`insert into review_log (user_id, word_id, grade) values (${USER_A}::uuid, ${a.id}::uuid, 4)`
    await raw`insert into review_log (user_id, word_id, grade) values (${USER_B}::uuid, ${b.id}::uuid, 4)`
})

afterAll(async () => {
    await cleanup([USER_A, USER_B])
    await closeRaw()
})

async function selectAsUser<T>(uid: string, table: 'words' | 'srs_state' | 'review_log'): Promise<T[]> {
    return raw.begin(async tx => {
        await tx`set local role authenticated`
        await tx.unsafe(`set local request.jwt.claims to '${JSON.stringify({ sub: uid, role: 'authenticated' })}'`)
        if (table === 'words') return tx`select * from words` as unknown as T[]
        if (table === 'srs_state') return tx`select * from srs_state` as unknown as T[]
        return tx`select * from review_log` as unknown as T[]
    }) as unknown as Promise<T[]>
}

describe('RLS isolation', () => {
    it('user A sees only their own words', async () => {
        const rows = await selectAsUser<{ user_id: string; term: string }>(USER_A, 'words')
        expect(rows.every(r => r.user_id === USER_A)).toBe(true)
        expect(rows.some(r => r.term === 'alpha')).toBe(true)
        expect(rows.some(r => r.term === 'bravo')).toBe(false)
    })

    it('user B sees only their own words', async () => {
        const rows = await selectAsUser<{ user_id: string; term: string }>(USER_B, 'words')
        expect(rows.every(r => r.user_id === USER_B)).toBe(true)
        expect(rows.some(r => r.term === 'bravo')).toBe(true)
        expect(rows.some(r => r.term === 'alpha')).toBe(false)
    })

    it('RLS hides other users srs_state rows', async () => {
        const rows = await selectAsUser<{ user_id: string }>(USER_A, 'srs_state')
        expect(rows.every(r => r.user_id === USER_A)).toBe(true)
    })

    it('RLS hides other users review_log rows', async () => {
        const rows = await selectAsUser<{ user_id: string }>(USER_A, 'review_log')
        expect(rows.every(r => r.user_id === USER_A)).toBe(true)
    })

    it('definition_cache is publicly readable by authenticated users', async () => {
        await raw`insert into definition_cache (term, definition, examples, source) values ('rlstest', 'd', '["e"]'::jsonb, 'dictionary') on conflict do nothing`
        const rows = await selectAsUser<{ term: string }>(USER_A, 'review_log')
        expect(Array.isArray(rows)).toBe(true)
        const cacheRows = await raw.begin(async tx => {
            await tx`set local role authenticated`
            await tx.unsafe(`set local request.jwt.claims to '${JSON.stringify({ sub: USER_A, role: 'authenticated' })}'`)
            return tx`select * from definition_cache where term = 'rlstest'`
        })
        expect(cacheRows).toHaveLength(1)
    })
})
