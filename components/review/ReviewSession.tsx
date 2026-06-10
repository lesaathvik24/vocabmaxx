'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
}

export function ReviewSession({ initialCards }: ReviewSessionProps) {
    const router = useRouter()
    const [session, setSession] = useState(() => createSession(initialCards))
    const [grading, setGrading] = useState(false)
    const startedAt = useRef(Date.now())

    const handleFlip = useCallback(() => {
        if (grading) return
        setSession((s) => toggleFlip(s))
    }, [grading])

    const handleGrade = useCallback(
        async (grade: Grade) => {
            const card = currentCard(session)
            if (!card || grading) return

            setGrading(true)
            try {
                const res = await fetch('/api/review/grade', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ wordId: card.id, grade }),
                })
                if (!res.ok) {
                    toast.error('Could not save your grade. Try again.')
                    return
                }
                setSession((s) => advance(s))
            } catch {
                toast.error('Network error. Your grade was not saved.')
            } finally {
                setGrading(false)
            }
        },
        [session, grading],
    )

    if (isDone(session)) {
        return (
            <SessionDoneScreen
                count={session.reviewedCount}
                durationMs={Date.now() - startedAt.current}
                onExit={() => router.push('/dashboard')}
            />
        )
    }

    const card = currentCard(session)
    if (!card) return null

    return (
        <div className="flex flex-col items-center gap-6 py-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Card {session.index + 1} of {session.cards.length}
            </p>
            <FlipCard
                key={card.id}
                term={card.term}
                definition={card.definition}
                examples={card.examples}
                flipped={session.flipped}
                onFlip={handleFlip}
            />
            <GradeButtons onGrade={handleGrade} disabled={!session.flipped || grading} />
        </div>
    )
}
