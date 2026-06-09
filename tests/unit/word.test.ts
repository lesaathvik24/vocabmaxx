import { describe, it, expect } from 'vitest'
import { createWord, type ValidWord } from '@/lib/domain/word'
import { InvalidWordError } from '@/lib/domain/errors'

const base = {
    id: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000002',
    term: 'ephemeral',
    definition: 'lasting for a very short time',
    examples: ['The ephemeral beauty of cherry blossoms.'],
    source: 'dictionary' as const,
    addedAt: new Date('2024-01-01T00:00:00Z'),
}

describe('createWord', () => {
    it('returns a ValidWord for valid input', () => {
        const w = createWord(base)
        expect(w.term).toBe('ephemeral')
        expect(w.definition).toBe('lasting for a very short time')
    })

    it('returned object does not leak a runtime __brand field', () => {
        const w = createWord(base)
        expect(Object.keys(w)).not.toContain('__brand')
        expect(JSON.stringify(w)).not.toContain('__brand')
    })

    it('throws InvalidWordError for NBSP-only term (\\u00A0)', () => {
        expect(() => createWord({ ...base, term: '  ' })).toThrow(InvalidWordError)
    })

    it('throws InvalidWordError when any example in a mixed array is empty', () => {
        expect(() => createWord({ ...base, examples: ['ok', ''] })).toThrow(InvalidWordError)
    })

    it('throws InvalidWordError for empty term', () => {
        expect(() => createWord({ ...base, term: '' })).toThrow(InvalidWordError)
    })

    it('throws InvalidWordError for whitespace-only term', () => {
        expect(() => createWord({ ...base, term: '   ' })).toThrow(InvalidWordError)
    })

    it('throws InvalidWordError for empty definition', () => {
        expect(() => createWord({ ...base, definition: '' })).toThrow(InvalidWordError)
    })

    it('throws InvalidWordError for whitespace-only definition', () => {
        expect(() => createWord({ ...base, definition: '\t\n' })).toThrow(InvalidWordError)
    })

    it('throws InvalidWordError for examples.length === 0', () => {
        expect(() => createWord({ ...base, examples: [] })).toThrow(InvalidWordError)
    })

    it('throws InvalidWordError for examples.length === 4', () => {
        expect(() => createWord({ ...base, examples: ['a', 'b', 'c', 'd'] })).toThrow(InvalidWordError)
    })

    it('throws InvalidWordError for an empty string example', () => {
        expect(() => createWord({ ...base, examples: [''] })).toThrow(InvalidWordError)
    })

    it('throws InvalidWordError for a whitespace-only example', () => {
        expect(() => createWord({ ...base, examples: ['   '] })).toThrow(InvalidWordError)
    })

    it('lowercases and trims term', () => {
        const w = createWord({ ...base, term: '  Ephemeral  ' })
        expect(w.term).toBe('ephemeral')
    })

    it('trims definition', () => {
        const w = createWord({ ...base, definition: '  lasting briefly  ' })
        expect(w.definition).toBe('lasting briefly')
    })

    it('trims each example', () => {
        const w = createWord({ ...base, examples: ['  hello world  ', '  second  '] })
        expect(w.examples[0]).toBe('hello world')
        expect(w.examples[1]).toBe('second')
    })

    it('brand is type-only: ValidWord assignment compiles, runtime shape is plain Word', () => {
        const w: ValidWord = createWord(base)
        expect(w.term).toBe(base.term)
        expect(w.id).toBe(base.id)
    })
})
