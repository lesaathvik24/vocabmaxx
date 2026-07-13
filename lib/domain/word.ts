import type { SRSState } from './srs'
import { InvalidWordError } from './errors'

/** One meaning of a word. A term like "flustered" has several. */
export interface Sense {
    partOfSpeech: string | null
    definition: string
    examples: string[]
}

export interface Word {
    id: string
    userId: string
    term: string
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
    phonetic: string | null
    audioUrl: string | null
    /**
     * Every meaning we found, primary first. Null for words captured before
     * multi-sense support — callers fall back to `definition` / `examples`.
     */
    senses: Sense[] | null
    addedAt: Date
}

export interface WordWithSRS extends Word {
    srs: SRSState & { dueDate: Date; lastReviewedAt: Date | null }
}

declare const validWordBrand: unique symbol
export type ValidWord = Word & { readonly [validWordBrand]: true }

interface CreateWordInput {
    id: string
    userId: string
    term: string
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
    phonetic: string | null
    audioUrl: string | null
    senses: Sense[] | null
    addedAt: Date
}

export interface WordFields {
    term: string
    definition: string
    examples: string[]
}

/**
 * Normalise and validate the editable fields of a word, throwing
 * `InvalidWordError` on any violation. Shared by `createWord` (post-persist
 * branding) and `word.service.save` (pre-persist guard) so the invariant has a
 * single definition.
 */
export function assertWordFields(input: WordFields): WordFields {
    const term = input.term.trim().toLowerCase()
    if (term.length === 0) throw new InvalidWordError('term must not be empty')

    const definition = input.definition.trim()
    if (definition.length === 0) throw new InvalidWordError('definition must not be empty')

    if (input.examples.length < 1 || input.examples.length > 3) {
        throw new InvalidWordError('examples must have 1-3 entries')
    }

    const examples = input.examples.map((e, i) => {
        const trimmed = e.trim()
        if (trimmed.length === 0) throw new InvalidWordError(`example[${i}] must not be empty`)
        return trimmed
    })

    return { term, definition, examples }
}

export function createWord(input: CreateWordInput): ValidWord {
    const { term, definition, examples } = assertWordFields(input)
    return {
        id: input.id,
        userId: input.userId,
        term,
        definition,
        examples,
        source: input.source,
        phonetic: input.phonetic,
        audioUrl: input.audioUrl,
        senses: input.senses,
        addedAt: input.addedAt,
    } as ValidWord
}
