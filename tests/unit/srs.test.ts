import { describe, it, expect } from 'vitest'
import { nextState, initialSRSState, type SRSState } from '@/lib/domain/srs'
import { Grade } from '@/lib/domain/grade'

const NOW = new Date('2024-01-01T00:00:00Z')
const DAY = 86_400_000

describe('nextState — SM-2 worked example from TECH_SPEC §3', () => {
    let state: SRSState = { ...initialSRSState }

    it('step 1: Good → reps=1, interval=1, ease=2.50', () => {
        const result = nextState(state, Grade.Good, NOW)
        state = result.state
        expect(result.state.repetitions).toBe(1)
        expect(result.state.intervalDays).toBe(1)
        expect(result.state.easeFactor).toBeCloseTo(2.5, 5)
        expect(result.dueDate.getTime()).toBe(NOW.getTime() + 1 * DAY)
    })

    it('step 2: Good → reps=2, interval=6, ease=2.50', () => {
        const result = nextState(state, Grade.Good, NOW)
        state = result.state
        expect(result.state.repetitions).toBe(2)
        expect(result.state.intervalDays).toBe(6)
        expect(result.state.easeFactor).toBeCloseTo(2.5, 5)
        expect(result.dueDate.getTime()).toBe(NOW.getTime() + 6 * DAY)
    })

    it('step 3: Good → reps=3, interval=15, ease=2.50', () => {
        const result = nextState(state, Grade.Good, NOW)
        state = result.state
        expect(result.state.repetitions).toBe(3)
        expect(result.state.intervalDays).toBe(15)
        expect(result.state.easeFactor).toBeCloseTo(2.5, 5)
        expect(result.dueDate.getTime()).toBe(NOW.getTime() + 15 * DAY)
    })

    it('step 4: Easy → reps=4, interval=38, ease=2.60', () => {
        const result = nextState(state, Grade.Easy, NOW)
        state = result.state
        expect(result.state.repetitions).toBe(4)
        expect(result.state.intervalDays).toBe(38)
        expect(result.state.easeFactor).toBeCloseTo(2.6, 5)
        expect(result.dueDate.getTime()).toBe(NOW.getTime() + 38 * DAY)
    })

    it('step 5: Again → reps=0, interval=1, ease≈1.80 (spec table typo; formula: 2.60 − 0.80)', () => {
        const result = nextState(state, Grade.Again, NOW)
        state = result.state
        expect(result.state.repetitions).toBe(0)
        expect(result.state.intervalDays).toBe(1)
        expect(result.state.easeFactor).toBeCloseTo(1.80, 5)
        expect(result.dueDate.getTime()).toBe(NOW.getTime() + 1 * DAY)
    })
})

describe('nextState — edge cases', () => {
    it('ease floor at 1.3 when repeatedly graded Hard', () => {
        let state: SRSState = { easeFactor: 1.35, intervalDays: 1, repetitions: 2 }
        const result = nextState(state, Grade.Hard, NOW)
        expect(result.state.easeFactor).toBeGreaterThanOrEqual(1.3)
    })

    it('Hard grade (3) increases interval without resetting', () => {
        const state: SRSState = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 }
        const result = nextState(state, Grade.Hard, NOW)
        expect(result.state.repetitions).toBe(3)
        expect(result.state.intervalDays).toBeGreaterThan(0)
    })

    it('Again always resets reps to 0 and sets interval to 1', () => {
        const state: SRSState = { easeFactor: 2.5, intervalDays: 30, repetitions: 5 }
        const result = nextState(state, Grade.Again, NOW)
        expect(result.state.repetitions).toBe(0)
        expect(result.state.intervalDays).toBe(1)
    })

    it('uses current time when no date provided', () => {
        const before = Date.now()
        const result = nextState(initialSRSState, Grade.Good)
        const after = Date.now()
        expect(result.dueDate.getTime()).toBeGreaterThanOrEqual(before + DAY)
        expect(result.dueDate.getTime()).toBeLessThanOrEqual(after + DAY)
    })

    it('first rep: interval is always 1 regardless of prior intervalDays', () => {
        const state: SRSState = { easeFactor: 2.5, intervalDays: 99, repetitions: 0 }
        const result = nextState(state, Grade.Good, NOW)
        expect(result.state.intervalDays).toBe(1)
    })
})
