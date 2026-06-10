import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the DB query + srs modules so the service can be unit-tested without a database.
vi.mock('@/lib/db/queries/words', () => ({
    updateForUser: vi.fn(),
    listWithSrsByUser: vi.fn(),
    findByIdForUser: vi.fn(),
    deleteByIdForUser: vi.fn(),
    listByUser: vi.fn(),
    findById: vi.fn(),
}))
vi.mock('@/lib/db/queries/srs', () => ({ getByWordId: vi.fn() }))
vi.mock('@/lib/db/queries/review-log', () => ({ listByWord: vi.fn() }))

import * as wordService from '@/lib/services/word.service'
import * as wordsQ from '@/lib/db/queries/words'
import type { Word } from '@/lib/domain/word'

function makeWord(overrides: Partial<Word> = {}): Word {
    return {
        id: 'w1',
        userId: 'u1',
        term: 'ephemeral',
        definition: 'lasting for only a short time',
        examples: ['The ephemeral nature of fame.'],
        source: 'dictionary',
        addedAt: new Date('2024-01-01'),
        ...overrides,
    }
}

beforeEach(() => vi.clearAllMocks())

describe('word.service.update — validation', () => {
    it('rejects an empty definition without hitting the DB', async () => {
        const res = await wordService.update('w1', 'u1', { definition: '   ' })
        expect(res.ok).toBe(false)
        if (!res.ok) expect(res.error.kind).toBe('invalid_word')
        expect(wordsQ.updateForUser).not.toHaveBeenCalled()
    })

    it('rejects 0 examples', async () => {
        const res = await wordService.update('w1', 'u1', { examples: ['  '] })
        expect(res.ok).toBe(false)
        if (!res.ok) expect(res.error.kind).toBe('invalid_word')
        expect(wordsQ.updateForUser).not.toHaveBeenCalled()
    })

    it('rejects more than 3 examples', async () => {
        const res = await wordService.update('w1', 'u1', { examples: ['a', 'b', 'c', 'd'] })
        expect(res.ok).toBe(false)
        if (!res.ok) expect(res.error.kind).toBe('invalid_word')
        expect(wordsQ.updateForUser).not.toHaveBeenCalled()
    })

    it('trims definition + examples and persists a valid patch', async () => {
        vi.mocked(wordsQ.updateForUser).mockResolvedValue(makeWord({ definition: 'new def' }))
        const res = await wordService.update('w1', 'u1', {
            definition: '  new def  ',
            examples: ['  one ', '', ' two '],
        })
        expect(res.ok).toBe(true)
        expect(wordsQ.updateForUser).toHaveBeenCalledWith('w1', 'u1', {
            definition: 'new def',
            examples: ['one', 'two'],
        })
    })

    it('maps a missing/foreign word to word_not_found', async () => {
        vi.mocked(wordsQ.updateForUser).mockResolvedValue(null)
        const res = await wordService.update('w1', 'u1', { definition: 'x' })
        expect(res.ok).toBe(false)
        if (!res.ok) expect(res.error.kind).toBe('word_not_found')
    })
})

describe('word.service.listWithStatus', () => {
    it('derives status from repetitions and due from due date', async () => {
        const now = new Date('2026-06-10T12:00:00Z')
        vi.mocked(wordsQ.listWithSrsByUser).mockResolvedValue([
            { ...makeWord({ id: 'a' }), repetitions: 0, dueDate: new Date('2026-06-09') }, // due, new
            { ...makeWord({ id: 'b' }), repetitions: 9, dueDate: new Date('2026-06-20') }, // not due, mastered
        ])
        const res = await wordService.listWithStatus('u1', now)
        expect(res).toHaveLength(2)
        expect(res[0]).toMatchObject({ id: 'a', status: 'new', due: true })
        expect(res[1]).toMatchObject({ id: 'b', status: 'mastered', due: false })
    })
})
