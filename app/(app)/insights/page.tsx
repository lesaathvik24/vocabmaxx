import { requireUser } from '@/lib/auth/server'
import * as analytics from '@/lib/services/analytics.service'
import * as analyticsQ from '@/lib/db/queries/analytics'
import * as wordService from '@/lib/services/word.service'
import { PageHeader } from '@/components/layout/PageHeader'
import { GrowthChart } from '@/components/insights/GrowthChart'
import { StatusDonut } from '@/components/insights/StatusDonut'
import { ProblemWords } from '@/components/insights/ProblemWords'

export const metadata = { title: 'Insights' }
export const dynamic = 'force-dynamic'

const GROWTH_WINDOW = 30
const RETENTION_WINDOW = 30

interface KpiProps {
    label: string
    value: string
    delta?: string
    accent?: 'success' | 'accent'
}

function Kpi({ label, value, delta, accent }: KpiProps) {
    const valueColor = accent === 'success' ? 'text-success' : accent === 'accent' ? 'text-accent' : 'text-foreground'
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-[12.5px] text-slate-2">{label}</p>
            <div className="mt-1.5 flex items-baseline gap-2">
                <span className={`num text-[30px] font-bold tracking-tight leading-none ${valueColor}`}>{value}</span>
                {delta && <span className="text-xs font-semibold text-success">{delta}</span>}
            </div>
        </div>
    )
}

export default async function InsightsPage() {
    const user = await requireUser()
    const now = new Date()
    const retentionStart = new Date(now)
    retentionStart.setUTCDate(retentionStart.getUTCDate() - RETENTION_WINDOW)

    const [growth, retention, outcomes, problems, words] = await Promise.all([
        analytics.vocabGrowth(user.id, GROWTH_WINDOW),
        analytics.retentionRate(user.id, RETENTION_WINDOW),
        analyticsQ.reviewOutcomes(user.id, retentionStart),
        analytics.problemWords(user.id, 5),
        wordService.listWithStatus(user.id),
    ])

    const gained = growth.length ? growth[growth.length - 1].cumulative - growth[0].cumulative : 0
    const counts = words.reduce(
        (acc, w) => {
            if (w.status === 'mastered') acc.mastered += 1
            else if (w.status === 'new') acc.fresh += 1
            else acc.learning += 1
            return acc
        },
        { mastered: 0, learning: 0, fresh: 0 },
    )

    return (
        <div className="space-y-6">
            <PageHeader
                title="Insights"
                description="Your vocabulary growth, retention, and the words giving you the most trouble."
            />

            {/* KPI tiles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Kpi
                    label="Retention rate"
                    value={`${Math.round(retention * 100)}%`}
                    accent="success"
                />
                <Kpi label={`Reviews · last ${RETENTION_WINDOW} days`} value={String(outcomes.total)} />
                <Kpi label="Words gained" value={gained > 0 ? `+${gained}` : String(gained)} accent="accent" />
            </div>

            {/* Chart + status donut */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
                <GrowthChart data={growth} />
                <StatusDonut mastered={counts.mastered} learning={counts.learning} fresh={counts.fresh} />
            </div>

            <ProblemWords
                words={problems.map((w) => ({
                    id: w.id,
                    term: w.term,
                    definition: w.definition,
                    lapses: w.lapses,
                    reviews: w.reviews,
                }))}
            />
        </div>
    )
}
