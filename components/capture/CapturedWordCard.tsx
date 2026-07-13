'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { BookOpen, Sparkles } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PronounceButton } from '@/components/words/PronounceButton'
import type { CapturedWord } from '@/lib/hooks/use-capture'

interface CapturedWordCardProps {
    word: CapturedWord
    onAddAnother?: () => void
}

export function CapturedWordCard({ word, onAddAnother }: CapturedWordCardProps) {
    const detailHref = `/words/${word.id}` as Route

    return (
        <div className="rounded-2xl border border-accent/30 bg-accent-soft/40 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                    Captured
                </span>
                <span className="text-[11px] text-muted-foreground">
                    via {word.source === 'llm' ? 'AI' : 'dictionary'}
                </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <h3 className="font-display text-2xl font-semibold tracking-tight">{word.term}</h3>
                <PronounceButton term={word.term} audioUrl={word.audioUrl} />
            </div>
            {word.phonetic && <p className="mt-0.5 text-sm text-muted-foreground">{word.phonetic}</p>}

            <p className="mt-3 font-serif text-base leading-relaxed">{word.definition}</p>

            {word.examples.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                    {word.examples.map((ex, i) => (
                        <li
                            key={i}
                            className="border-l-2 border-accent/30 pl-3 font-serif text-sm italic text-muted-foreground"
                        >
                            {ex}
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                <Link
                    href={detailHref}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                >
                    <BookOpen size={15} aria-hidden="true" />
                    View word
                </Link>
                {onAddAnother && (
                    <Button variant="ghost" size="sm" onClick={onAddAnother} className="gap-1.5">
                        <Sparkles size={15} aria-hidden="true" />
                        Add another
                    </Button>
                )}
            </div>
        </div>
    )
}
