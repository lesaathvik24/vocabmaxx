import { describe, it, expect } from 'vitest'
import { nextState, initialSRSState, type SRSState } from '@/lib/domain/srs'
import { Grade } from '@/lib/domain/grade'
import { InvalidSRSStateError } from '@/lib/domain/errors'

const NOW = new Date('2024-01-01T00:00:00Z')
const DAY = 86_400_000

describe('nextState — worked example step-by-step (TECH_SPEC §3)', () => {
    it('step 1: Good from initial → reps=1, interval=1, ease=2.50', () => {
        const r = nextState({ ...initialSRSState }, Grade.Good, NOW)
        expect(r.state.repetitions).toBe(1)
        expect(r.state.intervalDays).toBe(1)
        expect(r.state.easeFactor).toBeCloseTo(2.5, 5)
        expect(r.dueDate.getTime()).toBe(NOW.getTime() + 1 * DAY)
    })

    it('step 2: Good → reps=2, interval=6, ease=2.50', () => {
        const s1 = nextState({ ...initialSRSState }, Grade.Good, NOW).state
        const r = nextState(s1, Grade.Good, NOW)
        expect(r.state.repetitions).toBe(2)
        expect(r.state.intervalDays).toBe(6)
        expect(r.state.easeFactor).toBeCloseTo(2.5, 5)
        expect(r.dueDate.getTime()).toBe(NOW.getTime() + 6 * DAY)
    })

    it('step 3: Good → reps=3, interval=15, ease=2.50', () => {
        const s1 = nextState({ ...initialSRSState }, Grade.Good, NOW).state
        const s2 = nextState(s1, Grade.Good, NOW).state
        const r = nextState(s2, Grade.Good, NOW)
        expect(r.state.repetitions).toBe(3)
        expect(r.state.intervalDays).toBe(15)
        expect(r.state.easeFactor).toBeCloseTo(2.5, 5)
        expect(r.dueDate.getTime()).toBe(NOW.getTime() + 15 * DAY)
    })

    it('step 4: Easy → reps=4, interval=38, ease=2.60', () => {
        const s1 = nextState({ ...initialSRSState }, Grade.Good, NOW).state
        const s2 = nextState(s1, Grade.Good, NOW).state
        const s3 = nextState(s2, Grade.Good, NOW).state
        const r = nextState(s3, Grade.Easy, NOW)
        expect(r.state.repetitions).toBe(4)
        expect(r.state.intervalDays).toBe(38)
        expect(r.state.easeFactor).toBeCloseTo(2.6, 5)
        expect(r.dueDate.getTime()).toBe(NOW.getTime() + 38 * DAY)
    })

    it('step 5: Again → reps=0, interval=1, ease≈1.80', () => {
        const s1 = nextState({ ...initialSRSState }, Grade.Good, NOW).state
        const s2 = nextState(s1, Grade.Good, NOW).state
        const s3 = nextState(s2, Grade.Good, NOW).state
        const s4 = nextState(s3, Grade.Easy, NOW).state
        const r = nextState(s4, Grade.Again, NOW)
        expect(r.state.repetitions).toBe(0)
        expect(r.state.intervalDays).toBe(1)
        expect(r.state.easeFactor).toBeCloseTo(1.80, 5)
        expect(r.dueDate.getTime()).toBe(NOW.getTime() + 1 * DAY)
    })
})

describe('nextState — edge cases', () => {
    it('ease floors at exactly 1.3 when Hard would push it below', () => {
        const state: SRSState = { easeFactor: 1.31, intervalDays: 1, repetitions: 2 }
        const result = nextState(state, Grade.Hard, NOW)
        expect(result.state.easeFactor).toBe(1.3)
    })

    it('Hard repeated until ease floors and stays at 1.3', () => {
        let state: SRSState = { easeFactor: 1.5, intervalDays: 6, repetitions: 2 }
        for (let i = 0; i < 10; i++) {
            state = nextState(state, Grade.Hard, NOW).state
        }
        expect(state.easeFactor).toBeCloseTo(1.3, 5)
    })

    it('Easy grade raises ease above 2.5', () => {
        const state: SRSState = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 }
        const result = nextState(state, Grade.Easy, NOW)
        expect(result.state.easeFactor).toBeGreaterThan(2.5)
    })

    it('Again always resets reps to 0 and interval to 1', () => {
        const state: SRSState = { easeFactor: 2.5, intervalDays: 30, repetitions: 5 }
        const result = nextState(state, Grade.Again, NOW)
        expect(result.state.repetitions).toBe(0)
        expect(result.state.intervalDays).toBe(1)
    })

    it('Again from reps=0 state still resets correctly', () => {
        const result = nextState({ ...initialSRSState }, Grade.Again, NOW)
        expect(result.state.repetitions).toBe(0)
        expect(result.state.intervalDays).toBe(1)
        expect(result.dueDate.getTime()).toBe(NOW.getTime() + DAY)
    })

    it('first rep: interval is always 1 regardless of prior intervalDays', () => {
        const state: SRSState = { easeFactor: 2.5, intervalDays: 99, repetitions: 0 }
        const result = nextState(state, Grade.Good, NOW)
        expect(result.state.intervalDays).toBe(1)
    })

    it('reps=2 invariant: second Good always gives interval=6', () => {
        const s1 = nextState({ ...initialSRSState }, Grade.Good, NOW).state
        const r = nextState(s1, Grade.Good, NOW)
        expect(r.state.repetitions).toBe(2)
        expect(r.state.intervalDays).toBe(6)
    })

    it('reps=3 interval uses Math.round(intervalDays * easeFactor)', () => {
        const s1 = nextState({ ...initialSRSState }, Grade.Good, NOW).state
        const s2 = nextState(s1, Grade.Good, NOW).state
        const r = nextState(s2, Grade.Good, NOW)
        expect(r.state.intervalDays).toBe(Math.round(6 * 2.5))
    })

    it('uses current time when no date provided', () => {
        const before = Date.now()
        const result = nextState(initialSRSState, Grade.Good)
        const after = Date.now()
        expect(result.dueDate.getTime()).toBeGreaterThanOrEqual(before + DAY)
        expect(result.dueDate.getTime()).toBeLessThanOrEqual(after + DAY)
    })

    it('determinism: same input always yields same output', () => {
        const state: SRSState = { easeFactor: 2.3, intervalDays: 10, repetitions: 3 }
        const r1 = nextState(state, Grade.Hard, NOW)
        const r2 = nextState(state, Grade.Hard, NOW)
        expect(r1.state.easeFactor).toBe(r2.state.easeFactor)
        expect(r1.state.intervalDays).toBe(r2.state.intervalDays)
        expect(r1.state.repetitions).toBe(r2.state.repetitions)
        expect(r1.dueDate.getTime()).toBe(r2.dueDate.getTime())
    })

    it('throws InvalidSRSStateError on NaN easeFactor', () => {
        const state: SRSState = { easeFactor: NaN, intervalDays: 1, repetitions: 1 }
        expect(() => nextState(state, Grade.Good, NOW)).toThrow(InvalidSRSStateError)
    })

    it('throws InvalidSRSStateError on negative repetitions', () => {
        const state: SRSState = { easeFactor: 2.5, intervalDays: 1, repetitions: -1 }
        expect(() => nextState(state, Grade.Good, NOW)).toThrow(InvalidSRSStateError)
    })

    it('throws InvalidSRSStateError on non-integer intervalDays', () => {
        const state: SRSState = { easeFactor: 2.5, intervalDays: 1.5, repetitions: 1 }
        expect(() => nextState(state, Grade.Good, NOW)).toThrow(InvalidSRSStateError)
    })

    it('throws InvalidSRSStateError on easeFactor below floor', () => {
        const state: SRSState = { easeFactor: 1.0, intervalDays: 1, repetitions: 1 }
        expect(() => nextState(state, Grade.Good, NOW)).toThrow(InvalidSRSStateError)
    })

    it('independence: mutating returned state does not mutate input', () => {
        const input: SRSState = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 }
        const original = { ...input }
        const result = nextState(input, Grade.Good, NOW)
        result.state.easeFactor = 99
        result.state.intervalDays = 99
        result.state.repetitions = 99
        expect(input.easeFactor).toBe(original.easeFactor)
        expect(input.intervalDays).toBe(original.intervalDays)
        expect(input.repetitions).toBe(original.repetitions)
    })
})
