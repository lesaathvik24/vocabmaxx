import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDashboardData, repsToStatus } from '@/lib/services/dashboard.service'
import type { DashboardDeps } from '@/lib/services/dashboard.service'
import type { Word } from '@/lib/domain/word'

function makeDeps(): DashboardDeps {
    return {
        listWords: vi.fn(),
        countWords: vi.fn(),
        countDue: vi.fn(),
    }
}

function makeWord(overrides: Partial<Word> = {}): Word {
    return {
        id: 'w1',
        userId: 'u1',
        term: 'ephemeral',
        definition: 'lasting for only a short time',
        examples: ['The ephemeral nature of fame.'],
        source: 'dictionary',
        addedAt: new Date('2024-01-01'),
        ...overrides,
    }
}

beforeEach(() => vi.clearAllMocks())

describe('repsToStatus', () => {
    it('0 reps → new', () => expect(repsToStatus(0)).toBe('new'))
    it('1 reps → learning', () => expect(repsToStatus(1)).toBe('learning'))
    it('3 reps → learning', () => expect(repsToStatus(3)).toBe('learning'))
    it('4 reps → review', () => expect(repsToStatus(4)).toBe('review'))
    it('7 reps → review', () => expect(repsToStatus(7)).toBe('review'))
    it('8 reps → mastered', () => expect(repsToStatus(8)).toBe('mastered'))
})

describe('getDashboardData', () => {
    it('maps word rows to recentWords shape', async () => {
        const deps = makeDeps()
        vi.mocked(deps.listWords).mockResolvedValue([makeWord()])
        vi.mocked(deps.countWords).mockResolvedValue(1)
        vi.mocked(deps.countDue).mockResolvedValue(3)

        const data = await getDashboardData('u1', deps)
        expect(data.recentWords).toHaveLength(1)
        expect(data.recentWords[0].term).toBe('ephemeral')
        expect(data.recentWords[0].source).toBe('dictionary')
    })

    it('stats.learned and stats.due populated correctly', async () => {
        const deps = makeDeps()
        vi.mocked(deps.listWords).mockResolvedValue([])
        vi.mocked(deps.countWords).mockResolvedValue(42)
        vi.mocked(deps.countDue).mockResolvedValue(7)

        const data = await getDashboardData('u1', deps)
        expect(data.stats.learned).toBe(42)
        expect(data.stats.due).toBe(7)
        expect(data.stats.weekGoal).toBe(10)
        expect(data.stats.history).toHaveLength(7)
    })

    it('calls listWords with limit 10', async () => {
        const deps = makeDeps()
        vi.mocked(deps.listWords).mockResolvedValue([])
        vi.mocked(deps.countWords).mockResolvedValue(0)
        vi.mocked(deps.countDue).mockResolvedValue(0)

        await getDashboardData('u1', deps)
        expect(deps.listWords).toHaveBeenCalledWith('u1', { limit: 10 })
    })
})
