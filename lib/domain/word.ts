import type { SRSState } from './srs'
import { InvalidWordError } from './errors'

export interface Word {
    id: string
    userId: string
    term: string
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
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
    addedAt: Date
}

export function createWord(input: CreateWordInput): ValidWord {
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

    return {
        id: input.id,
        userId: input.userId,
        term,
        definition,
        examples,
        source: input.source,
        addedAt: input.addedAt,
    } as ValidWord
}
