import { describe, it, expect } from 'vitest'
import { computeStreak, buildDailyHistory, dayKey } from '@/lib/insights/dashboard'

describe('computeStreak', () => {
    const today = '2026-06-10'

    it('counts consecutive days ending today', () => {
        expect(computeStreak(['2026-06-08', '2026-06-09', '2026-06-10'], today)).toBe(3)
    })

    it('is 0 when there is a gap before today and nothing today/yesterday', () => {
        expect(computeStreak(['2026-06-01', '2026-06-02'], today)).toBe(0)
    })

    it('applies a one-day grace: still counts when today is not yet reviewed', () => {
        expect(computeStreak(['2026-06-08', '2026-06-09'], today)).toBe(2)
    })

    it('breaks the streak at the first missing day', () => {
        expect(computeStreak(['2026-06-10', '2026-06-08', '2026-06-07'], today)).toBe(1)
    })

    it('is 0 with no reviews', () => {
        expect(computeStreak([], today)).toBe(0)
    })
})

describe('buildDailyHistory', () => {
    const now = new Date('2026-06-10T12:00:00Z')

    it('produces a dense oldest→today array of the given length', () => {
        const h = buildDailyHistory([], now, 7)
        expect(h).toEqual([0, 0, 0, 0, 0, 0, 0])
    })

    it('places counts on the correct days with today last', () => {
        const h = buildDailyHistory(
            [
                { day: '2026-06-04', count: 1 },
                { day: '2026-06-10', count: 5 },
            ],
            now,
            7,
        )
        expect(h).toEqual([1, 0, 0, 0, 0, 0, 5])
    })

    it('ignores days outside the window', () => {
        const h = buildDailyHistory([{ day: '2026-06-01', count: 9 }], now, 7)
        expect(h.reduce((a, b) => a + b, 0)).toBe(0)
    })
})

describe('dayKey', () => {
    it('formats a date as a UTC YYYY-MM-DD key', () => {
        expect(dayKey(new Date('2026-06-10T23:30:00Z'))).toBe('2026-06-10')
    })
})
