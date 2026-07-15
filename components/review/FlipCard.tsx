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
    const resolvedSenses = toSenses(senses, definition, examples)
    const pos = resolvedSenses[0]?.partOfSpeech ?? null
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
                <div className="flip-face w-full h-full rounded-[24px] border border-border bg-card shadow-[0_2px_4px_rgba(20,30,60,.05),0_20px_44px_-26px_rgba(20,30,60,.3)] flex flex-col items-center justify-center p-8 select-none">
                    {pos && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{pos}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                        <p className="font-display font-semibold text-4xl tracking-tight text-center">{term}</p>
                        <PronounceButton term={term} audioUrl={audioUrl} />
                    </div>
                    {phonetic && <p className="num mt-1.5 text-base text-faint">{phonetic}</p>}
                    <p className="mt-8 text-xs text-faint flex items-center gap-1.5">
                        <kbd className="num inline-flex h-5 items-center rounded-md bg-muted px-2 text-[11px] font-semibold">
                            Space
                        </kbd>
                        to reveal
                    </p>
                </div>

                {/* Back */}
                <div className="flip-face flip-face-back w-full h-full rounded-[24px] border border-border bg-card shadow-[0_2px_4px_rgba(20,30,60,.05),0_20px_44px_-26px_rgba(20,30,60,.3)] flex flex-col overflow-hidden select-none">
                    <div className="flex items-center gap-2 px-6 pt-6 pb-4 border-b border-line-2">
                        {pos && (
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{pos}</span>
                        )}
                        <p className="font-display font-semibold text-2xl tracking-tight">{term}</p>
                        {phonetic && <span className="num text-sm text-faint">{phonetic}</span>}
                        <PronounceButton term={term} audioUrl={audioUrl} size="sm" className="ml-auto" />
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <SenseList senses={resolvedSenses} dense highlight={term} />
                    </div>
                </div>
            </div>
        </div>
    )
}
