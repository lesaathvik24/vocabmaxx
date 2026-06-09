import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchDefinition } from '@/lib/services/definition.service'
import { ok, err } from '@/lib/domain/errors'

function makeDeps() {
    return {
        cacheLookup: vi.fn(),
        cacheWrite: vi.fn().mockResolvedValue(undefined),
        dict: vi.fn(),
        llm: vi.fn(),
    }
}

beforeEach(() => vi.clearAllMocks())

describe('definition.service.fetchDefinition', () => {
    it('rejects invalid term without touching cache, dict, or llm', async () => {
        const deps = makeDeps()
        const r = await fetchDefinition('123abc', deps)
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('invalid_term')
        expect(deps.cacheLookup).not.toHaveBeenCalled()
        expect(deps.dict).not.toHaveBeenCalled()
        expect(deps.llm).not.toHaveBeenCalled()
    })

    it('cache hit short-circuits — dict and llm not called', async () => {
        const deps = makeDeps()
        deps.cacheLookup.mockResolvedValue({
            definition: 'cached def',
            examples: ['cached ex'],
            source: 'dictionary',
        })

        const r = await fetchDefinition('cached', deps)
        expect(r.ok).toBe(true)
        if (r.ok) expect(r.value.def.definition).toBe('cached def')
        expect(deps.dict).not.toHaveBeenCalled()
        expect(deps.llm).not.toHaveBeenCalled()
        expect(deps.cacheWrite).not.toHaveBeenCalled()
    })

    it('dict success caches result and never calls llm', async () => {
        const deps = makeDeps()
        deps.cacheLookup.mockResolvedValue(null)
        deps.dict.mockResolvedValue(ok({ definition: 'd', examples: ['e1'], source: 'dictionary' as const }))

        const r = await fetchDefinition('common', deps)
        expect(r.ok).toBe(true)
        expect(deps.cacheWrite).toHaveBeenCalledWith('common', expect.objectContaining({ source: 'dictionary' }))
        expect(deps.llm).not.toHaveBeenCalled()
    })

    it('dict not_found triggers llm fallback; success caches with source=llm', async () => {
        const deps = makeDeps()
        deps.cacheLookup.mockResolvedValue(null)
        deps.dict.mockResolvedValue(err({ kind: 'not_found' as const }))
        deps.llm.mockResolvedValue(ok({ definition: 'rare', examples: ['e1', 'e2'], source: 'llm' as const }))

        const r = await fetchDefinition('rare', deps)
        expect(r.ok).toBe(true)
        if (r.ok) expect(r.value.def.source).toBe('llm')
        expect(deps.llm).toHaveBeenCalledOnce()
        expect(deps.cacheWrite).toHaveBeenCalledWith('rare', expect.objectContaining({ source: 'llm' }))
    })

    it('dict network_failure also triggers llm fallback', async () => {
        const deps = makeDeps()
        deps.cacheLookup.mockResolvedValue(null)
        deps.dict.mockResolvedValue(err({ kind: 'network_failure' as const, cause: 'timeout' }))
        deps.llm.mockResolvedValue(ok({ definition: 'd', examples: ['e1', 'e2'], source: 'llm' as const }))

        const r = await fetchDefinition('word', deps)
        expect(r.ok).toBe(true)
        expect(deps.llm).toHaveBeenCalledOnce()
    })

    it('llm rate_limited surfaces error without caching', async () => {
        const deps = makeDeps()
        deps.cacheLookup.mockResolvedValue(null)
        deps.dict.mockResolvedValue(err({ kind: 'not_found' as const }))
        deps.llm.mockResolvedValue(err({ kind: 'rate_limited' as const }))

        const r = await fetchDefinition('word', deps)
        expect(r.ok).toBe(false)
        if (!r.ok) expect(r.error.kind).toBe('rate_limited')
        expect(deps.cacheWrite).not.toHaveBeenCalled()
    })

    it('normalizes term (trim + lowercase) before cache lookup', async () => {
        const deps = makeDeps()
        deps.cacheLookup.mockResolvedValue({ definition: 'd', examples: ['e'], source: 'dictionary' })
        const r = await fetchDefinition('  Hello  ', deps)
        expect(r.ok).toBe(true)
        expect(deps.cacheLookup).toHaveBeenCalledWith('hello')
        if (r.ok) expect(r.value.term).toBe('hello')
    })
})
