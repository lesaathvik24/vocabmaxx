'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { FlipCard } from './FlipCard'
import { GradeButtons } from './GradeButtons'
import { SessionDoneScreen } from './SessionDoneScreen'
import {
    advance,
    createSession,
    currentCard,
    isDone,
    toggleFlip,
    type ReviewCard,
} from '@/lib/review/session'

type Grade = 0 | 3 | 4 | 5

interface ReviewSessionProps {
    initialCards: ReviewCard[]
    /**
     * Practice (cram) mode. When true, grades are NOT persisted and the SRS
     * schedule is left untouched — words are simply flipped through for revision.
     */
    practice?: boolean
}

export function ReviewSession({ initialCards, practice = false }: ReviewSessionProps) {
    const router = useRouter()
    const [session, setSession] = useState(() => createSession(initialCards))
    // Number of grade saves still in flight. Used only for a subtle indicator;
    // the UI never blocks on it (optimistic advance).
    const [savingCount, setSavingCount] = useState(0)
    const startedAt = useRef(Date.now())

    const handleFlip = useCallback(() => {
        setSession((s) => toggleFlip(s))
    }, [])

    const handleGrade = useCallback(
        (grade: Grade) => {
            const card = currentCard(session)
            if (!card || !session.flipped) return

            // Optimistic: advance immediately so the next card shows with zero delay.
            setSession((s) => advance(s))

            // Practice mode never touches the server / SRS schedule.
            if (practice) return

            setSavingCount((n) => n + 1)
            void fetch('/api/review/grade', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ wordId: card.id, grade }),
            })
                .then((res) => {
                    if (!res.ok) toast.error(`Could not save grade for "${card.term}". It may resurface.`)
                })
                .catch(() => {
                    toast.error(`Network error saving "${card.term}". It may resurface.`)
                })
                .finally(() => setSavingCount((n) => Math.max(0, n - 1)))
        },
        [session, practice],
    )

    const done = isDone(session)

    // Refresh server components (e.g. sidebar due badge) once a real review
    // session finishes and grades have been persisted.
    useEffect(() => {
        if (done && !practice) router.refresh()
    }, [done, practice, router])

    const handleRestart = useCallback(() => {
        startedAt.current = Date.now()
        setSession(createSession(initialCards))
    }, [initialCards])

    if (done) {
        return (
            <SessionDoneScreen
                count={session.reviewedCount}
                durationMs={Date.now() - startedAt.current}
                practice={practice}
                onExit={() => router.push('/dashboard')}
                onRestart={handleRestart}
            />
        )
    }

    const card = currentCard(session)
    if (!card) return null

    return (
        <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Card {session.index + 1} of {session.cards.length}
                </p>
                {practice && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                        Practice
                    </span>
                )}
                {savingCount > 0 && (
                    <span
                        className="flex items-center gap-1 text-[11px] text-muted-foreground"
                        aria-live="polite"
                    >
                        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                        Saving
                    </span>
                )}
            </div>
            <FlipCard
                key={card.id}
                term={card.term}
                definition={card.definition}
                examples={card.examples}
                phonetic={card.phonetic}
                audioUrl={card.audioUrl}
                senses={card.senses}
                flipped={session.flipped}
                onFlip={handleFlip}
            />
            <GradeButtons onGrade={handleGrade} disabled={!session.flipped} />
            {practice && (
                <p className="max-w-xs text-center text-xs text-muted-foreground">
                    Practice mode — your review schedule won&apos;t change.
                </p>
            )}
        </div>
    )
}
