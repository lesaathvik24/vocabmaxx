import 'server-only'
import * as wordsQ from '@/lib/db/queries/words'
import * as srsQ from '@/lib/db/queries/srs'
import * as analyticsQ from '@/lib/db/queries/analytics'
import { repsToStatus, type WordStatus } from '@/lib/words/filter'
import { computeStreak, buildDailyHistory, dayKey } from '@/lib/insights/dashboard'

export interface RecentWord {
    id: string
    term: string
    definition: string
    status: WordStatus
    source: 'dictionary' | 'llm'
    capturedAt: Date
}

export interface DashboardStats {
    learned: number
    streakDays: number
    retention: number
    due: number
    weekDone: number
    weekGoal: number
    history: number[]
}

export interface DashboardData {
    recentWords: RecentWord[]
    stats: DashboardStats
}

const WEEK_DAYS = 7
const RETENTION_WINDOW = 30
const STREAK_WINDOW = 366
const WEEK_GOAL = 10

export interface DashboardDeps {
    listRecent: typeof wordsQ.listWithSrsByUser
    countWords: typeof wordsQ.countByUser
    countDue: typeof srsQ.countDue
    reviewOutcomes: typeof analyticsQ.reviewOutcomes
    dailyReviewCounts: typeof analyticsQ.dailyReviewCounts
    reviewDayKeys: typeof analyticsQ.reviewDayKeys
}

const defaultDeps: DashboardDeps = {
    listRecent: wordsQ.listWithSrsByUser,
    countWords: wordsQ.countByUser,
    countDue: srsQ.countDue,
    reviewOutcomes: analyticsQ.reviewOutcomes,
    dailyReviewCounts: analyticsQ.dailyReviewCounts,
    reviewDayKeys: analyticsQ.reviewDayKeys,
}

function startOfUTCDay(now: Date, daysAgo: number): Date {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - daysAgo)
    d.setUTCHours(0, 0, 0, 0)
    return d
}

export async function getDashboardData(
    userId: string,
    deps: DashboardDeps = defaultDeps,
    now: Date = new Date(),
): Promise<DashboardData> {
    const weekStart = startOfUTCDay(now, WEEK_DAYS - 1)
    const retentionStart = startOfUTCDay(now, RETENTION_WINDOW - 1)
    const streakStart = startOfUTCDay(now, STREAK_WINDOW - 1)

    const [recentRows, learned, due, outcomes, daily, dayKeys] = await Promise.all([
        deps.listRecent(userId, { limit: 10 }),
        deps.countWords(userId),
        deps.countDue(userId, now),
        deps.reviewOutcomes(userId, retentionStart),
        deps.dailyReviewCounts(userId, weekStart),
        deps.reviewDayKeys(userId, streakStart),
    ])

    const recentWords: RecentWord[] = recentRows.map((w) => ({
        id: w.id,
        term: w.term,
        definition: w.definition,
        status: repsToStatus(w.repetitions),
        source: w.source,
        capturedAt: w.addedAt,
    }))

    const history = buildDailyHistory(daily, now, WEEK_DAYS)
    const weekDone = history.reduce((a, b) => a + b, 0)
    const retention = outcomes.total === 0 ? 0 : outcomes.passed / outcomes.total

    return {
        recentWords,
        stats: {
            learned,
            due,
            retention,
            streakDays: computeStreak(dayKeys, dayKey(now)),
            weekDone,
            weekGoal: WEEK_GOAL,
            history,
        },
    }
}

export { repsToStatus }
