import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import * as words from '@/lib/db/queries/words'
import { createAuthUser, cleanup, closeRaw, raw } from './_helpers'

const USER_A = '11111111-1111-1111-1111-aaaaaaaaaaaa'
const USER_B = '11111111-1111-1111-1111-bbbbbbbbbbbb'

beforeAll(async () => {
    await createAuthUser(USER_A, 'a-words@test.vocabmaxx.local')
    await createAuthUser(USER_B, 'b-words@test.vocabmaxx.local')
})

afterAll(async () => {
    await cleanup([USER_A, USER_B])
    await closeRaw()
})

beforeEach(async () => {
    await raw`delete from words where user_id = any(${[USER_A, USER_B]}::uuid[])`
})

describe('words queries', () => {
    it('insert returns a Word with generated id and addedAt', async () => {
        const w = await words.insert({
            userId: USER_A,
            term: 'alacrity',
            definition: 'brisk and cheerful readiness',
            examples: ['she accepted with alacrity'],
            source: 'dictionary', phonetic: null, audioUrl: null, senses: null,
        })
        expect(w.id).toMatch(/^[0-9a-f-]{36}$/)
        expect(w.term).toBe('alacrity')
        expect(w.addedAt).toBeInstanceOf(Date)
    })

    it('findByIdForUser returns null when not found', async () => {
        const w = await words.findByIdForUser('00000000-0000-0000-0000-000000000000', USER_A)
        expect(w).toBeNull()
    })

    it('findByUserAndTerm scopes by user', async () => {
        await words.insert({ userId: USER_A, term: 'shared', definition: 'd', examples: ['e'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null })
        const found = await words.findByUserAndTerm(USER_A, 'shared')
        const notFound = await words.findByUserAndTerm(USER_B, 'shared')
        expect(found?.term).toBe('shared')
        expect(notFound).toBeNull()
    })

    it('unique (userId, term) is enforced', async () => {
        await words.insert({ userId: USER_A, term: 'dup', definition: 'd', examples: ['e'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null })
        await expect(
            words.insert({ userId: USER_A, term: 'dup', definition: 'd2', examples: ['e2'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null }),
        ).rejects.toThrow()
    })

    it('insertIfAbsent returns null on a duplicate instead of throwing', async () => {
        const first = await words.insertIfAbsent({ userId: USER_A, term: 'safedup', definition: 'd', examples: ['e'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null })
        expect(first).not.toBeNull()
        const second = await words.insertIfAbsent({ userId: USER_A, term: 'safedup', definition: 'd2', examples: ['e2'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null })
        expect(second).toBeNull()
    })

    it('listByUser returns rows in descending addedAt', async () => {
        await words.insert({ userId: USER_A, term: 'first', definition: 'd', examples: ['e'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null })
        await new Promise(r => setTimeout(r, 10))
        await words.insert({ userId: USER_A, term: 'second', definition: 'd', examples: ['e'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null })
        const list = await words.listByUser(USER_A)
        expect(list).toHaveLength(2)
        expect(list[0].term).toBe('second')
    })

    it('deleteByIdForUser cascades srs_state and review_log', async () => {
        const w = await words.insert({ userId: USER_A, term: 'cascade', definition: 'd', examples: ['e'], source: 'dictionary', phonetic: null, audioUrl: null, senses: null })
        await raw`insert into srs_state (word_id, user_id, due_date) values (${w.id}::uuid, ${USER_A}::uuid, now())`
        await raw`insert into review_log (user_id, word_id, grade) values (${USER_A}::uuid, ${w.id}::uuid, 4)`

        const deleted = await words.deleteByIdForUser(w.id, USER_A)
        expect(deleted).toBe(true)

        const srs = await raw`select 1 from srs_state where word_id = ${w.id}::uuid`
        const log = await raw`select 1 from review_log where word_id = ${w.id}::uuid`
        expect(srs).toHaveLength(0)
        expect(log).toHaveLength(0)
    })
})
