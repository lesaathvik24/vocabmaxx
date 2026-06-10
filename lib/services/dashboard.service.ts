import 'server-only'
import * as wordsQ from '@/lib/db/queries/words'
import * as srsQ from '@/lib/db/queries/srs'

export interface RecentWord {
    id: string
    term: string
    definition: string
    status: 'new' | 'learning' | 'review' | 'mastered'
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

function repsToStatus(reps: number): RecentWord['status'] {
    if (reps === 0) return 'new'
    if (reps <= 3) return 'learning'
    if (reps <= 7) return 'review'
    return 'mastered'
}

export interface DashboardDeps {
    listWords: typeof wordsQ.listByUser
    countWords: typeof wordsQ.countByUser
    countDue: typeof srsQ.countDue
}

const defaultDeps: DashboardDeps = {
    listWords: wordsQ.listByUser,
    countWords: wordsQ.countByUser,
    countDue: srsQ.countDue,
}

export async function getDashboardData(
    userId: string,
    deps: DashboardDeps = defaultDeps,
): Promise<DashboardData> {
    const [recentRaw, learned, due] = await Promise.all([
        deps.listWords(userId, { limit: 10 }),
        deps.countWords(userId),
        deps.countDue(userId, new Date()),
    ])

    const recentWords: RecentWord[] = recentRaw.map(w => ({
        id: w.id,
        term: w.term,
        definition: w.definition,
        // words query doesn't join srs_state, so reps unknown — treat as new
        // TODO(phase 7 analytics): join srs_state to get real reps for status mapping
        status: 'new',
        source: w.source,
        capturedAt: w.addedAt,
    }))

    return {
        recentWords,
        stats: {
            learned,
            due,
            // TODO(phase 7 analytics): derive from review_log SQL views — grouped daily counts
            streakDays: 0,
            retention: 0,
            weekDone: 0,
            weekGoal: 10,
            history: [0, 0, 0, 0, 0, 0, 0],
        },
    }
}

export { repsToStatus }
