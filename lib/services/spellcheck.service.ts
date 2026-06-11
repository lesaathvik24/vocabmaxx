import 'server-only'
import { suggestSpelling } from './llm.client'
import { TERM_PATTERN } from '@/lib/validation/capture.schema'

export interface SpellcheckDeps {
    suggest: typeof suggestSpelling
}

const defaultDeps: SpellcheckDeps = {
    suggest: suggestSpelling,
}

/**
 * Given a term that failed definition lookup (likely a misspelling), return a
 * corrected spelling worth offering the user, or null when none applies.
 *
 * Null on: LLM error/unavailable, no correction, a correction equal to the input
 * (after normalization), or a correction that isn't a single valid term. Never
 * throws — a failed spellcheck degrades to "no suggestion", not a capture error.
 */
export async function suggestCorrection(
    rawTerm: string,
    deps: SpellcheckDeps = defaultDeps,
): Promise<string | null> {
    const term = rawTerm.trim().toLowerCase()

    const result = await deps.suggest(term)
    if (!result.ok || result.value === null) return null

    const correction = result.value.trim().toLowerCase()
    if (correction.length === 0 || correction.length > 64) return null
    if (correction === term) return null
    if (!TERM_PATTERN.test(correction)) return null

    return correction
}
