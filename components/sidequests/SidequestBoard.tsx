'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Target } from 'lucide-react'
import { toUserMessage } from '@/lib/utils/errors'
import { StatsHeader } from './StatsHeader'
import { QuestCard } from './QuestCard'
import type { SidequestBoardData, SubmitResult } from './types'

export function SidequestBoard({ data }: { data: SidequestBoardData }) {
    const router = useRouter()
    const expiredNotified = useRef(false)

    useEffect(() => {
        if (data.justExpired > 0 && !expiredNotified.current) {
            expiredNotified.current = true
            const n = data.justExpired
            toast.warning(
                n === 1
                    ? 'A sidequest expired before you completed it.'
                    : `${n} sidequests expired before you completed them.`,
            )
        }
    }, [data.justExpired])

    const handleSubmit = useCallback(
        async (questId: string, sentence: string): Promise<SubmitResult | null> => {
            try {
                const res = await fetch('/api/sidequests/submit', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ questId, sentence }),
                })
                const json = await res.json()
                if (!res.ok) {
                    toast.error(toUserMessage(json?.error?.kind ?? ''))
                    return null
                }
                const result = json.data as SubmitResult
                if (result.correct) {
                    toast.success(`Nice — usage confirmed. +${result.xpAwarded} XP`)
                    router.refresh()
                }
                return result
            } catch {
                toast.error('Network error. Please try again.')
                return null
            }
        },
        [router],
    )

    return (
        <div className="space-y-6">
            <StatsHeader stats={data.stats} />

            {data.active ? (
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Current sidequest
                    </h2>
                    <QuestCard quest={data.active} variant="active" onSubmit={handleSubmit} />
                </section>
            ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                    <Target size={28} className="mx-auto text-muted-foreground" aria-hidden="true" />
                    <p className="mt-3 text-sm text-muted-foreground">
                        No active sidequest right now. Capture a few more words to unlock the next one.
                    </p>
                </div>
            )}

            {data.backlog.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Redemption — finish these for reduced XP
                    </h2>
                    <div className="space-y-3">
                        {data.backlog.map((q) => (
                            <QuestCard key={q.id} quest={q} variant="redemption" onSubmit={handleSubmit} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
