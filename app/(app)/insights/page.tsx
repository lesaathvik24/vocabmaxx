import { requireUser } from '@/lib/auth/server'
import * as analytics from '@/lib/services/analytics.service'
import * as analyticsQ from '@/lib/db/queries/analytics'
import { PageHeader } from '@/components/layout/PageHeader'
import { GrowthChart } from '@/components/insights/GrowthChart'
import { RetentionGauge } from '@/components/insights/RetentionGauge'
import { ProblemWords } from '@/components/insights/ProblemWords'

export const metadata = { title: 'Insights' }
export const dynamic = 'force-dynamic'

const GROWTH_WINDOW = 30
const RETENTION_WINDOW = 30

export default async function InsightsPage() {
    const user = await requireUser()
    const now = new Date()
    const retentionStart = new Date(now)
    retentionStart.setUTCDate(retentionStart.getUTCDate() - RETENTION_WINDOW)

    const [growth, retention, outcomes, problems] = await Promise.all([
        analytics.vocabGrowth(user.id, GROWTH_WINDOW),
        analytics.retentionRate(user.id, RETENTION_WINDOW),
        analyticsQ.reviewOutcomes(user.id, retentionStart),
        analytics.problemWords(user.id, 5),
    ])

    return (
        <div className="space-y-6">
            <PageHeader
                title="Insights"
                description="Your vocabulary growth, retention, and the words giving you the most trouble."
            />

            <GrowthChart data={growth} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr] items-start">
                <RetentionGauge
                    rate={retention}
                    windowDays={RETENTION_WINDOW}
                    sampleSize={outcomes.total}
                />
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
        </div>
    )
}
