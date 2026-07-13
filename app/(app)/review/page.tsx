import Link from 'next/link'
import type { Route } from 'next'
import { CheckCircle2, RotateCcw, Sparkles, BookOpen } from 'lucide-react'
import { requireUser } from '@/lib/auth/server'
import * as srsService from '@/lib/services/srs.service'
import * as wordService from '@/lib/services/word.service'
import { ReviewSession } from '@/components/review/ReviewSession'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import type { ReviewCard } from '@/lib/review/session'

export const metadata = { title: 'Review' }
export const dynamic = 'force-dynamic'

const captureHref: Route = '/capture'

export default async function ReviewPage({
    searchParams,
}: {
    searchParams: Promise<{ mode?: string }>
}) {
    const user = await requireUser()
    const { mode } = await searchParams
    const practice = mode === 'practice'

    // Practice (cram) mode — flip through ALL captured words without touching the schedule.
    if (practice) {
        const words = await wordService.listForUser(user.id)
        if (words.length === 0) {
            return (
                <CaughtUp
                    title="Nothing to practice yet"
                    body="Capture a few words first, then come back to practice them as often as you like."
                    showPractice={false}
                />
            )
        }
        const cards: ReviewCard[] = words.map((w) => ({
            id: w.id,
            term: w.term,
            definition: w.definition,
            examples: w.examples,
            phonetic: w.phonetic,
            audioUrl: w.audioUrl,
            senses: w.senses,
        }))
        return <ReviewSession initialCards={cards} practice />
    }

    const due = await srsService.listDue(user.id)

    if (due.length === 0) {
        const totalWords = (await wordService.listForUser(user.id)).length
        return (
            <CaughtUp
                title="All caught up"
                body="No cards are due right now. Capture more words, or keep practicing the words you already have — practice won't change your schedule."
                showPractice={totalWords > 0}
            />
        )
    }

    const cards: ReviewCard[] = due.map((w) => ({
        id: w.id,
        term: w.term,
        definition: w.definition,
        examples: w.examples,
        phonetic: w.phonetic,
        audioUrl: w.audioUrl,
        senses: w.senses,
    }))

    return <ReviewSession initialCards={cards} />
}

const practiceHref = '/review?mode=practice' as Route

function CaughtUp({
    title,
    body,
    showPractice,
}: {
    title: string
    body: string
    showPractice: boolean
}) {
    return (
        <EmptyState
            variant="page"
            tone="success"
            icon={<CheckCircle2 size={28} aria-hidden="true" />}
            title={title}
            body={body}
            actions={
                <>
                    {showPractice && (
                        <Link
                            href={practiceHref}
                            className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}
                        >
                            <RotateCcw size={16} aria-hidden="true" />
                            Practice anyway
                        </Link>
                    )}
                    <Link
                        href={captureHref}
                        className={cn(buttonVariants({ variant: 'accent' }), 'gap-2')}
                    >
                        {showPractice ? <Sparkles size={16} aria-hidden="true" /> : <BookOpen size={16} aria-hidden="true" />}
                        Capture a word
                    </Link>
                </>
            }
        />
    )
}
