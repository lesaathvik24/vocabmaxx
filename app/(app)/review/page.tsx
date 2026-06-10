import { CheckCircle2 } from 'lucide-react'
import { requireUser } from '@/lib/auth/server'
import * as srsService from '@/lib/services/srs.service'
import { ReviewSession } from '@/components/review/ReviewSession'
import { ComingSoon } from '@/components/layout/ComingSoon'
import type { ReviewCard } from '@/lib/review/session'

export const metadata = { title: 'Review' }
export const dynamic = 'force-dynamic'

export default async function ReviewPage() {
    const user = await requireUser()
    const due = await srsService.listDue(user.id)

    if (due.length === 0) {
        return (
            <ComingSoon
                icon={CheckCircle2}
                title="All caught up"
                body="No cards are due right now. Capture more words or come back when reviews are scheduled."
            />
        )
    }

    const cards: ReviewCard[] = due.map((w) => ({
        id: w.id,
        term: w.term,
        definition: w.definition,
        examples: w.examples,
    }))

    return <ReviewSession initialCards={cards} />
}
