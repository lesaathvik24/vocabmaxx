import 'server-only'
import * as analyticsQ from '@/lib/db/queries/analytics'

export interface GrowthPoint {
    date: string // 'YYYY-MM-DD'
    cumulative: number
}

export interface WordWithStats {
    id: string
    term: string
    definition: string
    lapses: number
    reviews: number
    lastReviewedAt: Date | null
}

export interface AnalyticsDeps {
    countWordsBefore: typeof analyticsQ.countWordsBefore
    dailyAddedCounts: typeof analyticsQ.dailyAddedCounts
    reviewOutcomes: typeof analyticsQ.reviewOutcomes
    topFailedWords: typeof analyticsQ.topFailedWords
}

const defaultDeps: AnalyticsDeps = {
    countWordsBefore: analyticsQ.countWordsBefore,
    dailyAddedCounts: analyticsQ.dailyAddedCounts,
    reviewOutcomes: analyticsQ.reviewOutcomes,
    topFailedWords: analyticsQ.topFailedWords,
}

function dayKey(d: Date): string {
    return d.toISOString().slice(0, 10)
}

/**
 * Pure: turn a baseline count + sparse per-day "added" counts into a dense,
 * cumulative series with one point for every day in the window (oldest → newest).
 * Exported for unit testing.
 */
export function buildGrowthSeries(
    baseline: number,
    daily: { day: string; added: number }[],
    windowDays: number,
    now: Date,
): GrowthPoint[] {
    const addedByDay = new Map(daily.map((d) => [d.day, d.added]))
    const series: GrowthPoint[] = []
    let cumulative = baseline

    // Window covers `windowDays` days ending today (inclusive).
    const start = new Date(now)
    start.setUTCDate(start.getUTCDate() - (windowDays - 1))

    for (let i = 0; i < windowDays; i++) {
        const d = new Date(start)
        d.setUTCDate(start.getUTCDate() + i)
        const key = dayKey(d)
        cumulative += addedByDay.get(key) ?? 0
        series.push({ date: key, cumulative })
    }
    return series
}

export async function vocabGrowth(
    userId: string,
    windowDays: number,
    deps: AnalyticsDeps = defaultDeps,
    now: Date = new Date(),
): Promise<GrowthPoint[]> {
    const start = new Date(now)
    start.setUTCDate(start.getUTCDate() - (windowDays - 1))
    start.setUTCHours(0, 0, 0, 0)

    const [baseline, daily] = await Promise.all([
        deps.countWordsBefore(userId, start),
        deps.dailyAddedCounts(userId, start),
    ])
    return buildGrowthSeries(baseline, daily, windowDays, now)
}

export async function retentionRate(
    userId: string,
    windowDays: number,
    deps: AnalyticsDeps = defaultDeps,
    now: Date = new Date(),
): Promise<number> {
    const start = new Date(now)
    start.setUTCDate(start.getUTCDate() - windowDays)

    const { total, passed } = await deps.reviewOutcomes(userId, start)
    if (total === 0) return 0
    return passed / total
}

export async function problemWords(
    userId: string,
    limit: number,
    deps: AnalyticsDeps = defaultDeps,
): Promise<WordWithStats[]> {
    const rows = await deps.topFailedWords(userId, limit)
    return rows.map((r) => ({
        id: r.id,
        term: r.term,
        definition: r.definition,
        lapses: r.lapses,
        reviews: r.reviews,
        lastReviewedAt: r.lastReviewedAt,
    }))
}
