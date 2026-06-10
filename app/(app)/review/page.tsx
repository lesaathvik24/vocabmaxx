import Link from 'next/link'
import type { Route } from 'next'
import { CheckCircle2, RotateCcw, Sparkles, BookOpen } from 'lucide-react'
import { requireUser } from '@/lib/auth/server'
import * as srsService from '@/lib/services/srs.service'
import * as wordService from '@/lib/services/word.service'
import { ReviewSession } from '@/components/review/ReviewSession'
import { buttonVariants } from '@/components/ui/button'
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
        <div className="flex flex-col items-center justify-center text-center min-h-[60vh] px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success mb-5">
                <CheckCircle2 size={28} aria-hidden="true" />
            </div>
            <h1 className="font-display font-semibold text-2xl tracking-tight">{title}</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">{body}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
                    className={cn(buttonVariants(), 'bg-accent text-accent-foreground hover:bg-accent/90 gap-2')}
                >
                    {showPractice ? <Sparkles size={16} aria-hidden="true" /> : <BookOpen size={16} aria-hidden="true" />}
                    Capture a word
                </Link>
            </div>
        </div>
    )
}
