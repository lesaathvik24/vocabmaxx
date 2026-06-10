import { requireUser } from '@/lib/auth/server'
import { getDashboardData } from '@/lib/services/dashboard.service'
import { DueBanner } from '@/components/dashboard/DueBanner'
import { StatTiles } from '@/components/dashboard/StatTiles'
import { WeekProgress } from '@/components/dashboard/WeekProgress'
import { RecentCaptures, type CapturedWord } from '@/components/dashboard/RecentCaptures'

export const metadata = { title: 'Dashboard' }

function greeting(): string {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
}

function formatDate(): string {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    })
}

export default async function DashboardPage() {
    const user = await requireUser()
    const { recentWords, stats } = await getDashboardData(user.id)

    const capturedWords: CapturedWord[] = recentWords.map((w) => ({
        id: w.id,
        term: w.term,
        definition: w.definition,
        status: w.status,
        source: w.source,
        capturedAt: w.capturedAt,
    }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatDate()}
                </p>
                <h1 className="font-display font-semibold text-2xl sm:text-3xl mt-1">
                    {greeting()}
                </h1>
            </div>

            {/* Due banner */}
            <DueBanner due={stats.due} estMinutes={Math.ceil(stats.due * 0.8)} />

            {/* Stat tiles */}
            <StatTiles stats={stats} />

            {/* Bottom row: recent captures + week progress */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6 items-start">
                <RecentCaptures words={capturedWords} />
                <WeekProgress stats={stats} />
            </div>
        </div>
    )
}
