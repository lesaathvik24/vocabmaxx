import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDashboardData, repsToStatus } from '@/lib/services/dashboard.service'
import type { DashboardDeps } from '@/lib/services/dashboard.service'
import type { WordListRow } from '@/lib/db/queries/words'

function makeDeps(over: Partial<DashboardDeps> = {}): DashboardDeps {
    return {
        listRecent: vi.fn().mockResolvedValue([]),
        countWords: vi.fn().mockResolvedValue(0),
        countDue: vi.fn().mockResolvedValue(0),
        reviewOutcomes: vi.fn().mockResolvedValue({ total: 0, passed: 0 }),
        dailyReviewCounts: vi.fn().mockResolvedValue([]),
        reviewDayKeys: vi.fn().mockResolvedValue([]),
        sidequestStats: vi.fn().mockResolvedValue({ xp: 0, completed: 0, missed: 0 }),
        ...over,
    }
}

function makeRow(over: Partial<WordListRow> = {}): WordListRow {
    return {
        id: 'w1',
        userId: 'u1',
        term: 'ephemeral',
        definition: 'lasting for only a short time',
        examples: ['The ephemeral nature of fame.'],
        source: 'dictionary',
        addedAt: new Date('2024-01-01'),
        repetitions: 0,
        dueDate: new Date('2024-01-01'),
        ...over,
    }
}

const NOW = new Date('2026-06-10T12:00:00Z')

beforeEach(() => vi.clearAllMocks())

describe('repsToStatus (re-exported from lib/words/filter)', () => {
    it('0 reps → new', () => expect(repsToStatus(0)).toBe('new'))
    it('1 reps → learning', () => expect(repsToStatus(1)).toBe('learning'))
    it('4 reps → review', () => expect(repsToStatus(4)).toBe('review'))
    it('8 reps → mastered', () => expect(repsToStatus(8)).toBe('mastered'))
})

describe('getDashboardData', () => {
    it('maps rows to recentWords with real status derived from repetitions', async () => {
        const deps = makeDeps({
            listRecent: vi.fn().mockResolvedValue([
                makeRow({ id: 'a', term: 'alpha', repetitions: 0 }),
                makeRow({ id: 'b', term: 'bravo', repetitions: 9 }),
            ]),
        })
        const data = await getDashboardData('u1', deps, NOW)
        expect(data.recentWords).toHaveLength(2)
        expect(data.recentWords[0]).toMatchObject({ term: 'alpha', status: 'new' })
        expect(data.recentWords[1]).toMatchObject({ term: 'bravo', status: 'mastered' })
        expect(deps.listRecent).toHaveBeenCalledWith('u1', { limit: 10 })
    })

    it('populates learned/due and a 7-day history', async () => {
        const deps = makeDeps({
            countWords: vi.fn().mockResolvedValue(42),
            countDue: vi.fn().mockResolvedValue(7),
            sidequestStats: vi.fn().mockResolvedValue({ xp: 130, completed: 13, missed: 4 }),
        })
        const data = await getDashboardData('u1', deps, NOW)
        expect(data.stats.learned).toBe(42)
        expect(data.stats.due).toBe(7)
        expect(data.stats.xp).toBe(130)
        expect(data.stats.weekGoal).toBe(10)
        expect(data.stats.history).toHaveLength(7)
    })

    it('computes retention from review outcomes', async () => {
        const deps = makeDeps({
            reviewOutcomes: vi.fn().mockResolvedValue({ total: 10, passed: 8 }),
        })
        const data = await getDashboardData('u1', deps, NOW)
        expect(data.stats.retention).toBeCloseTo(0.8)
    })

    it('derives weekDone as the sum of the daily history', async () => {
        const deps = makeDeps({
            dailyReviewCounts: vi.fn().mockResolvedValue([
                { day: '2026-06-09', count: 3 },
                { day: '2026-06-10', count: 2 },
            ]),
        })
        const data = await getDashboardData('u1', deps, NOW)
        expect(data.stats.weekDone).toBe(5)
        expect(data.stats.history[6]).toBe(2) // today
    })

    it('computes the streak from distinct review days', async () => {
        const deps = makeDeps({
            reviewDayKeys: vi.fn().mockResolvedValue(['2026-06-08', '2026-06-09', '2026-06-10']),
        })
        const data = await getDashboardData('u1', deps, NOW)
        expect(data.stats.streakDays).toBe(3)
    })
})
