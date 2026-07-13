'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { PronounceButton } from '@/components/words/PronounceButton'
import { SenseList, toSenses } from '@/components/words/SenseList'
import type { Sense } from '@/lib/domain/word'

interface FlipCardProps {
    term: string
    definition: string
    examples: string[]
    phonetic?: string | null
    audioUrl?: string | null
    senses?: Sense[] | null
    flipped: boolean
    onFlip: () => void
}

export function FlipCard({ term, definition, examples, phonetic, audioUrl, senses, flipped, onFlip }: FlipCardProps) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key !== ' ' && e.key !== 'Enter') return
            const target = e.target as HTMLElement | null
            if (target?.closest('button, a, input, textarea, select, [role="button"]')) return
            e.preventDefault()
            onFlip()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onFlip])

    return (
        <div
            className="flip-scene w-full max-w-[420px] md:max-w-[560px] mx-auto"
            style={{ height: 320 }}
        >
            <div
                className={cn('flip-card-inner w-full h-full cursor-pointer', flipped && 'flipped')}
                onClick={onFlip}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onFlip()
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={
                    flipped
                        ? 'Definition shown. Grade your recall.'
                        : `Recall the meaning of "${term}". Press Space to reveal.`
                }
                aria-pressed={flipped}
            >
                {/* Front */}
                <div className="flip-face w-full h-full rounded-2xl border border-border bg-card shadow-sm flex flex-col items-center justify-center p-8 select-none">
                    <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-3xl text-center">{term}</p>
                        <PronounceButton term={term} audioUrl={audioUrl} />
                    </div>
                    {phonetic && <p className="mt-1 text-sm text-muted-foreground">{phonetic}</p>}
                    <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
                        <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                            Space
                        </kbd>
                        to reveal
                    </p>
                </div>

                {/* Back */}
                <div className="flip-face flip-face-back w-full h-full rounded-2xl border border-border bg-card shadow-sm flex flex-col p-6 overflow-y-auto select-none">
                    <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-2xl">{term}</p>
                        <PronounceButton term={term} audioUrl={audioUrl} size="sm" />
                    </div>
                    <SenseList
                        senses={toSenses(senses, definition, examples)}
                        dense
                        className="mt-3"
                    />
                </div>
            </div>
        </div>
    )
}
