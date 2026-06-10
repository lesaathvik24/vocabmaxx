import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extract, saveBulk } from '@/lib/services/import.service'
import { ok, err } from '@/lib/domain/errors'
import type { ExtractDeps, SaveBulkDeps } from '@/lib/services/import.service'

function makeExtractDeps(): ExtractDeps {
    return { llmExtract: vi.fn() }
}

function makeSaveDeps(): SaveBulkDeps {
    return {
        wordSave: vi.fn(),
        defFetch: vi.fn(),
    }
}

beforeEach(() => vi.clearAllMocks())

describe('importService.extract', () => {
    it('rejects empty text', async () => {
        const deps = makeExtractDeps()
        const r = await extract('', deps)
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('invalid_input')
        expect(deps.llmExtract).not.toHaveBeenCalled()
    })

    it('rejects text longer than 5000 chars', async () => {
        const deps = makeExtractDeps()
        const r = await extract('a'.repeat(5001), deps)
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('invalid_input')
        expect(deps.llmExtract).not.toHaveBeenCalled()
    })

    it('dedupes and lowercases candidates', async () => {
        const deps = makeExtractDeps()
        vi.mocked(deps.llmExtract).mockResolvedValue(ok(['Ephemeral', 'ephemeral', 'Lucid']))
        const r = await extract('some paragraph text', deps)
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.value).toContain('ephemeral')
            expect(r.value).toContain('lucid')
            expect(r.value.filter(t => t === 'ephemeral')).toHaveLength(1)
        }
    })

    it('caps at 15 candidates', async () => {
        const deps = makeExtractDeps()
        vi.mocked(deps.llmExtract).mockResolvedValue(
            ok(Array.from({ length: 20 }, (_, i) => `word${i}`)),
        )
        const r = await extract('text', deps)
        expect(r.ok).toBe(true)
        if (r.ok) expect(r.value.length).toBeLessThanOrEqual(15)
    })

    it('surfaces rate_limited from LLM', async () => {
        const deps = makeExtractDeps()
        vi.mocked(deps.llmExtract).mockResolvedValue(err({ kind: 'rate_limited' }))
        const r = await extract('text', deps)
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('rate_limited')
    })
})

describe('importService.saveBulk', () => {
    it('rejects empty terms array', async () => {
        const deps = makeSaveDeps()
        const r = await saveBulk('user1', [], deps)
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('invalid_input')
        expect(deps.defFetch).not.toHaveBeenCalled()
    })

    it('aggregates added, skipped, failed without throwing', async () => {
        const deps = makeSaveDeps()
        vi.mocked(deps.defFetch)
            .mockResolvedValueOnce(ok({ term: 'alpha', def: { definition: 'd', examples: ['e'], source: 'dictionary' as const } }))
            .mockResolvedValueOnce(ok({ term: 'beta', def: { definition: 'd', examples: ['e'], source: 'dictionary' as const } }))
            .mockResolvedValueOnce(err({ kind: 'not_found' as const }))

        vi.mocked(deps.wordSave)
            .mockResolvedValueOnce(ok({ id: '1', userId: 'u', term: 'alpha', definition: 'd', examples: ['e'], source: 'dictionary', addedAt: new Date() }))
            .mockResolvedValueOnce(err({ kind: 'duplicate_term' as const }))

        const r = await saveBulk('user1', ['alpha', 'beta', 'gamma'], deps)
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.value.added).toBe(1)
            expect(r.value.skipped).toBe(1)
            expect(r.value.failed).toBe(1)
            expect(r.value.addedTerms).toEqual(['alpha'])
        }
    })

    it('does not throw on individual save failure', async () => {
        const deps = makeSaveDeps()
        vi.mocked(deps.defFetch).mockResolvedValue(ok({ term: 'word', def: { definition: 'd', examples: ['e'], source: 'llm' as const } }))
        vi.mocked(deps.wordSave).mockResolvedValue(err({ kind: 'network_failure' as const, cause: 'DB down' }))

        const r = await saveBulk('user1', ['word'], deps)
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.value.failed).toBe(1)
            expect(r.value.added).toBe(0)
        }
    })
})
