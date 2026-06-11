import { describe, it, expect, vi, beforeEach } from 'vitest'
import { suggestCorrection } from '@/lib/services/spellcheck.service'
import { ok, err } from '@/lib/domain/errors'

function makeDeps() {
    return { suggest: vi.fn() }
}

beforeEach(() => vi.clearAllMocks())

describe('spellcheck.service.suggestCorrection', () => {
    it('returns the corrected word for a loose misspelling', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(ok('exacerbate'))
        expect(await suggestCorrection('exaacerbait', deps)).toBe('exacerbate')
    })

    it('normalizes the input term (trim + lowercase) before suggesting', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(ok('rhythm'))
        await suggestCorrection('  RYTHM  ', deps)
        expect(deps.suggest).toHaveBeenCalledWith('rythm')
    })

    it('lowercases and trims the returned correction', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(ok('  Definitely  '))
        expect(await suggestCorrection('definately', deps)).toBe('definitely')
    })

    it('returns null when the model offers no correction', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(ok(null))
        expect(await suggestCorrection('asdfghjkl', deps)).toBeNull()
    })

    it('returns null when the correction equals the input (no real change)', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(ok('Hello'))
        expect(await suggestCorrection('hello', deps)).toBeNull()
    })

    it('rejects a correction that is not a single valid term (spaces)', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(ok('two words'))
        expect(await suggestCorrection('twowrds', deps)).toBeNull()
    })

    it('rejects a correction containing digits', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(ok('h3llo'))
        expect(await suggestCorrection('helo', deps)).toBeNull()
    })

    it('rejects an over-long correction', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(ok('a'.repeat(65)))
        expect(await suggestCorrection('aaaa', deps)).toBeNull()
    })

    it('returns null (never throws) when the LLM errors', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(err({ kind: 'rate_limited' as const }))
        expect(await suggestCorrection('exaacerbait', deps)).toBeNull()
    })

    it('returns null when the LLM is unavailable (no key)', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(err({ kind: 'no_fallback_available' as const }))
        expect(await suggestCorrection('exaacerbait', deps)).toBeNull()
    })

    it('preserves valid internal hyphens/apostrophes in a correction', async () => {
        const deps = makeDeps()
        deps.suggest.mockResolvedValue(ok("o'clock"))
        expect(await suggestCorrection('oclock', deps)).toBe("o'clock")
    })
})
