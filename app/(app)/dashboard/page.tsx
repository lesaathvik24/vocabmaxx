import { requireUser } from '@/lib/auth/server'
import { getDashboardData } from '@/lib/services/dashboard.service'
import * as preferencesService from '@/lib/services/preferences.service'
import { FirstRunHero } from '@/components/dashboard/FirstRunHero'
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
    const [{ recentWords, stats }, prefs] = await Promise.all([
        getDashboardData(user.id),
        preferencesService.get(user.id),
    ])

    const firstName = prefs.displayName?.trim().split(/\s+/)[0]
    const heading = firstName ? `${greeting()}, ${firstName}` : greeting()

    const firstRun = recentWords.length === 0 && stats.learned === 0 && stats.due === 0
    if (firstRun) {
        return (
            <div className="space-y-6">
                <div>
                    <p className="num text-[13px] font-medium text-slate-2">
                        {formatDate()}
                    </p>
                    <h1 className="font-display font-semibold text-[26px] tracking-tight mt-0.5">
                        {heading}
                    </h1>
                </div>
                <FirstRunHero displayName={prefs.displayName} />
            </div>
        )
    }

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
                <p className="num text-[13px] font-medium text-slate-2">
                    {formatDate()}
                </p>
                <h1 className="font-display font-semibold text-[26px] tracking-tight mt-0.5">
                    {heading}
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
