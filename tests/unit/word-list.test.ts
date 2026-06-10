import { describe, it, expect } from 'vitest'
import { repsToStatus, filterWords, type FilterableWord } from '@/lib/words/filter'

function makeWord(overrides: Partial<FilterableWord> = {}): FilterableWord {
    return {
        term: 'ephemeral',
        definition: 'lasting for only a short time',
        status: 'new',
        due: false,
        ...overrides,
    }
}

describe('repsToStatus', () => {
    it('0 reps → new', () => expect(repsToStatus(0)).toBe('new'))
    it('negative reps → new', () => expect(repsToStatus(-1)).toBe('new'))
    it('1 reps → learning', () => expect(repsToStatus(1)).toBe('learning'))
    it('3 reps → learning', () => expect(repsToStatus(3)).toBe('learning'))
    it('4 reps → review', () => expect(repsToStatus(4)).toBe('review'))
    it('7 reps → review', () => expect(repsToStatus(7)).toBe('review'))
    it('8 reps → mastered', () => expect(repsToStatus(8)).toBe('mastered'))
})

describe('filterWords — search', () => {
    const words = [
        makeWord({ term: 'alacrity', definition: 'brisk and cheerful readiness' }),
        makeWord({ term: 'ephemeral', definition: 'lasting a short time' }),
        makeWord({ term: 'quixotic', definition: 'exceedingly idealistic' }),
    ]

    it('returns all words with no query', () => {
        expect(filterWords(words)).toHaveLength(3)
    })

    it('matches on term (case-insensitive)', () => {
        const res = filterWords(words, { query: 'ALA' })
        expect(res).toHaveLength(1)
        expect(res[0].term).toBe('alacrity')
    })

    it('matches on definition', () => {
        const res = filterWords(words, { query: 'idealistic' })
        expect(res).toHaveLength(1)
        expect(res[0].term).toBe('quixotic')
    })

    it('matches a shared substring across multiple rows', () => {
        const res = filterWords(words, { query: 'a' })
        // alacrity (term), ephemeral (definition "a short"), quixotic ("idealistic")
        expect(res.length).toBeGreaterThan(1)
    })

    it('trims whitespace-only queries to "match all"', () => {
        expect(filterWords(words, { query: '   ' })).toHaveLength(3)
    })

    it('returns empty array when nothing matches', () => {
        expect(filterWords(words, { query: 'zzzzz' })).toHaveLength(0)
    })
})

describe('filterWords — status filter', () => {
    const words = [
        makeWord({ term: 'a', status: 'new', due: true }),
        makeWord({ term: 'b', status: 'learning', due: false }),
        makeWord({ term: 'c', status: 'mastered', due: true }),
        makeWord({ term: 'd', status: 'mastered', due: false }),
    ]

    it('all → every word', () => {
        expect(filterWords(words, { filter: 'all' })).toHaveLength(4)
    })

    it('due → only due cards regardless of status', () => {
        const res = filterWords(words, { filter: 'due' })
        expect(res.map((w) => w.term)).toEqual(['a', 'c'])
    })

    it('mastered → only mastered cards regardless of due', () => {
        const res = filterWords(words, { filter: 'mastered' })
        expect(res.map((w) => w.term)).toEqual(['c', 'd'])
    })

    it('combines filter + search', () => {
        const res = filterWords(words, { filter: 'mastered', query: 'c' })
        expect(res).toHaveLength(1)
        expect(res[0].term).toBe('c')
    })
})
