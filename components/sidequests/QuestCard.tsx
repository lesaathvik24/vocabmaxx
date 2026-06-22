'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageSquare, Mic, Check, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { XP_ON_TIME, XP_LATE } from '@/lib/domain/sidequest'
import type { SidequestDTO, SubmitResult } from './types'

interface QuestCardProps {
    quest: SidequestDTO
    variant: 'active' | 'redemption'
    onSubmit: (questId: string, sentence: string) => Promise<SubmitResult | null>
}

function formatLeft(ms: number): string {
    if (ms <= 0) return 'time’s up'
    const mins = Math.floor(ms / 60000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export function QuestCard({ quest, variant, onSubmit }: QuestCardProps) {
    const [sentence, setSentence] = useState('')
    const [judging, setJudging] = useState(false)
    const [cross, setCross] = useState<string | null>(null)
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (variant !== 'active') return
        const id = setInterval(() => setNow(Date.now()), 30_000)
        return () => clearInterval(id)
    }, [variant])

    const msLeft = new Date(quest.expiresAt).getTime() - now
    const expired = variant === 'active' && msLeft <= 0
    const ChannelIcon = quest.channel === 'irl' ? Mic : MessageSquare
    // Reduced XP once the window has elapsed (redemption, or an active quest past time).
    const xp = variant === 'redemption' || expired ? XP_LATE : XP_ON_TIME

    async function handleSubmit() {
        const text = sentence.trim()
        if (!text || judging) return
        setJudging(true)
        setCross(null)
        const result = await onSubmit(quest.id, text)
        setJudging(false)
        if (result && !result.correct) setCross(result.reason)
        // On success the parent refreshes the board, unmounting this card.
    }

    return (
        <div
            className={cn(
                'rounded-2xl border bg-card p-5 shadow-sm space-y-4',
                variant === 'active' && !expired ? 'border-accent/40' : 'border-border',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                        <ChannelIcon size={12} aria-hidden="true" />
                        {quest.channel === 'irl' ? 'Say it' : 'Write it'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <Sparkles size={12} aria-hidden="true" />
                        +{xp} XP
                    </span>
                </div>
                {variant === 'active' && (
                    <span className={cn('text-xs font-medium', expired ? 'text-destructive' : 'text-muted-foreground')}>
                        {formatLeft(msLeft)}
                    </span>
                )}
            </div>

            <div>
                <h3 className="font-display font-semibold text-xl">{quest.term}</h3>
                <p className="text-sm text-muted-foreground">{quest.definition}</p>
            </div>

            <p className="text-sm leading-relaxed">
                <span className="font-medium text-foreground">Mission: </span>
                {quest.scenario}
            </p>

            <div className="space-y-2">
                <label htmlFor={`submit-${quest.id}`} className="sr-only">
                    How you used “{quest.term}”
                </label>
                <textarea
                    id={`submit-${quest.id}`}
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    placeholder={`Write the sentence where you used “${quest.term}”…`}
                    rows={2}
                    disabled={judging}
                    className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                />
                {cross && (
                    <p className="flex items-start gap-1.5 text-sm text-destructive" aria-live="polite">
                        <X size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                        {cross}
                    </p>
                )}
                {expired && !cross && (
                    <p className="text-xs text-muted-foreground">
                        Past the 10-hour window — this still counts, for reduced XP (+{XP_LATE}).
                    </p>
                )}
                <Button onClick={handleSubmit} disabled={judging || sentence.trim().length === 0} className="w-full sm:w-auto">
                    {judging ? (
                        <>
                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                            Judging…
                        </>
                    ) : (
                        <>
                            <Check size={16} aria-hidden="true" />
                            {expired ? 'Submit (late)' : 'Submit usage'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
