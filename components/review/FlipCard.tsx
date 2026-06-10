'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface FlipCardProps {
    term: string
    definition: string
    examples: string[]
    flipped: boolean
    onFlip: () => void
}

export function FlipCard({ term, definition, examples, flipped, onFlip }: FlipCardProps) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                onFlip()
            }
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
                    <p className="font-display font-semibold text-3xl text-center">{term}</p>
                    <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
                        <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                            Space
                        </kbd>
                        to reveal
                    </p>
                </div>

                {/* Back */}
                <div className="flip-face flip-face-back w-full h-full rounded-2xl border border-border bg-card shadow-sm flex flex-col p-6 overflow-y-auto select-none">
                    <p className="font-display font-semibold text-2xl">{term}</p>
                    <p className="mt-3 font-serif text-base leading-relaxed text-foreground">
                        {definition}
                    </p>
                    {examples.length > 0 && (
                        <ul className="mt-4 space-y-1.5">
                            {examples.map((ex, i) => (
                                <li
                                    key={i}
                                    className="font-serif text-sm italic text-muted-foreground pl-3 border-l-2 border-border"
                                >
                                    {ex}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}
