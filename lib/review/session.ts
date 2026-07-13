import type { Sense } from '@/lib/domain/word'

export interface ReviewCard {
    id: string
    term: string
    definition: string
    examples: string[]
    phonetic: string | null
    audioUrl: string | null
    senses: Sense[] | null
}

export interface ReviewSessionState {
    cards: ReviewCard[]
    index: number
    flipped: boolean
    reviewedCount: number
}

export function createSession(cards: ReviewCard[]): ReviewSessionState {
    return { cards, index: 0, flipped: false, reviewedCount: 0 }
}

export function currentCard(state: ReviewSessionState): ReviewCard | null {
    return state.cards[state.index] ?? null
}

export function isDone(state: ReviewSessionState): boolean {
    return state.index >= state.cards.length
}

export function toggleFlip(state: ReviewSessionState): ReviewSessionState {
    if (isDone(state)) return state
    return { ...state, flipped: !state.flipped }
}

export function advance(state: ReviewSessionState): ReviewSessionState {
    if (isDone(state)) return state
    return {
        ...state,
        index: state.index + 1,
        flipped: false,
        reviewedCount: state.reviewedCount + 1,
    }
}
