import { describe, it, expect } from 'vitest'
import {
    advance,
    createSession,
    currentCard,
    isDone,
    toggleFlip,
    type ReviewCard,
} from '@/lib/review/session'

const cards: ReviewCard[] = [
    { id: 'a', term: 'alacrity', definition: 'eagerness', examples: ['ex a'], phonetic: null, audioUrl: null },
    { id: 'b', term: 'brusque', definition: 'abrupt', examples: ['ex b'], phonetic: null, audioUrl: null },
]

describe('review session state machine', () => {
    it('starts at first card, unflipped, zero reviewed', () => {
        const s = createSession(cards)
        expect(currentCard(s)?.id).toBe('a')
        expect(s.flipped).toBe(false)
        expect(s.reviewedCount).toBe(0)
        expect(isDone(s)).toBe(false)
    })

    it('empty deck is done immediately', () => {
        const s = createSession([])
        expect(isDone(s)).toBe(true)
        expect(currentCard(s)).toBeNull()
    })

    it('toggleFlip flips and flips back', () => {
        const s = createSession(cards)
        const flipped = toggleFlip(s)
        expect(flipped.flipped).toBe(true)
        expect(toggleFlip(flipped).flipped).toBe(false)
    })

    it('advance moves to next card, resets flip, counts review', () => {
        const s = advance(toggleFlip(createSession(cards)))
        expect(currentCard(s)?.id).toBe('b')
        expect(s.flipped).toBe(false)
        expect(s.reviewedCount).toBe(1)
        expect(isDone(s)).toBe(false)
    })

    it('advancing past last card finishes the session', () => {
        const s = advance(advance(createSession(cards)))
        expect(isDone(s)).toBe(true)
        expect(currentCard(s)).toBeNull()
        expect(s.reviewedCount).toBe(2)
    })

    it('advance and toggleFlip are no-ops once done', () => {
        const done = advance(advance(createSession(cards)))
        expect(advance(done)).toBe(done)
        expect(toggleFlip(done)).toBe(done)
    })

    it('does not mutate prior states', () => {
        const s0 = createSession(cards)
        const s1 = toggleFlip(s0)
        advance(s1)
        expect(s0.flipped).toBe(false)
        expect(s1.index).toBe(0)
    })
})
