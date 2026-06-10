import { BarChart3 } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export const metadata = { title: 'Insights' }

export default function InsightsPage() {
    return (
        <ComingSoon
            icon={BarChart3}
            title="Insights are brewing"
            body="Growth charts, retention, and your problem words — all once you've reviewed a few sessions. Start a review or capture more words to feed the numbers."
        />
    )
}
