import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    buildGrowthSeries,
    vocabGrowth,
    retentionRate,
    problemWords,
    type AnalyticsDeps,
} from '@/lib/services/analytics.service'

function makeDeps(): AnalyticsDeps {
    return {
        countWordsBefore: vi.fn(),
        dailyAddedCounts: vi.fn(),
        reviewOutcomes: vi.fn(),
        topFailedWords: vi.fn(),
    }
}

beforeEach(() => vi.clearAllMocks())

describe('buildGrowthSeries (pure)', () => {
    const now = new Date('2026-06-10T12:00:00Z')

    it('produces one point per day across the window', () => {
        const series = buildGrowthSeries(0, [], 7, now)
        expect(series).toHaveLength(7)
        expect(series[0].date).toBe('2026-06-04')
        expect(series[6].date).toBe('2026-06-10')
    })

    it('starts every point at the baseline when nothing was added', () => {
        const series = buildGrowthSeries(5, [], 3, now)
        expect(series.map((p) => p.cumulative)).toEqual([5, 5, 5])
    })

    it('accumulates daily additions on top of the baseline', () => {
        const series = buildGrowthSeries(
            2,
            [
                { day: '2026-06-09', added: 3 },
                { day: '2026-06-10', added: 1 },
            ],
            3,
            now,
        )
        // days: 06-08 (2), 06-09 (2+3=5), 06-10 (5+1=6)
        expect(series.map((p) => p.cumulative)).toEqual([2, 5, 6])
    })

    it('ignores additions outside the window days but still cumulates correctly', () => {
        const series = buildGrowthSeries(0, [{ day: '2026-06-10', added: 4 }], 2, now)
        expect(series.map((p) => p.cumulative)).toEqual([0, 4])
    })
})

describe('vocabGrowth', () => {
    it('combines baseline + daily counts into a cumulative series', async () => {
        const deps = makeDeps()
        vi.mocked(deps.countWordsBefore).mockResolvedValue(10)
        vi.mocked(deps.dailyAddedCounts).mockResolvedValue([{ day: '2026-06-10', added: 2 }])

        const series = await vocabGrowth('u1', 3, deps, new Date('2026-06-10T12:00:00Z'))
        expect(series).toHaveLength(3)
        expect(series[series.length - 1].cumulative).toBe(12)
    })
})

describe('retentionRate', () => {
    it('returns passed / total', async () => {
        const deps = makeDeps()
        vi.mocked(deps.reviewOutcomes).mockResolvedValue({ total: 10, passed: 8 })
        expect(await retentionRate('u1', 30, deps)).toBeCloseTo(0.8)
    })

    it('returns 0 when there are no reviews (no divide-by-zero)', async () => {
        const deps = makeDeps()
        vi.mocked(deps.reviewOutcomes).mockResolvedValue({ total: 0, passed: 0 })
        expect(await retentionRate('u1', 30, deps)).toBe(0)
    })
})

describe('problemWords', () => {
    it('maps query rows to WordWithStats', async () => {
        const deps = makeDeps()
        vi.mocked(deps.topFailedWords).mockResolvedValue([
            {
                id: 'w1',
                term: 'quixotic',
                definition: 'idealistic',
                lapses: 4,
                reviews: 6,
                lastReviewedAt: new Date('2026-06-01'),
            },
        ])
        const res = await problemWords('u1', 5, deps)
        expect(res).toHaveLength(1)
        expect(res[0]).toMatchObject({ term: 'quixotic', lapses: 4, reviews: 6 })
        expect(deps.topFailedWords).toHaveBeenCalledWith('u1', 5)
    })
})
