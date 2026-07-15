'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { BookOpen, Sparkles } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PronounceButton } from '@/components/words/PronounceButton'
import { SenseList, toSenses } from '@/components/words/SenseList'
import type { CapturedWord } from '@/lib/hooks/use-capture'

interface CapturedWordCardProps {
    word: CapturedWord
    onAddAnother?: () => void
}

export function CapturedWordCard({ word, onAddAnother }: CapturedWordCardProps) {
    const detailHref = `/words/${word.id}` as Route
    const pos = toSenses(word.senses, word.definition, word.examples)[0]?.partOfSpeech ?? null

    return (
        <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_2px_4px_rgba(20,30,60,.04),0_20px_44px_-26px_rgba(20,30,60,.3)] animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* header */}
            <div className="flex items-end gap-3 border-b border-line-2 px-7 pt-6 pb-5">
                <div className="min-w-0">
                    {pos && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{pos}</p>
                    )}
                    <h3 className="mt-1 font-display text-[32px] font-semibold tracking-tight leading-none">
                        {word.term}
                    </h3>
                </div>
                {word.phonetic && <p className="num pb-1 text-[15px] text-faint">{word.phonetic}</p>}
                <PronounceButton term={word.term} audioUrl={word.audioUrl} className="ml-auto" />
            </div>

            {/* body */}
            <div className="px-7 py-6">
                <SenseList
                    senses={toSenses(word.senses, word.definition, word.examples)}
                    dense
                    highlight={word.term}
                />
            </div>

            {/* footer */}
            <div className="flex flex-wrap items-center gap-3 border-t border-line-2 bg-surface-2 px-7 py-4">
                <div className="flex items-center gap-2 text-[13px] text-faint">
                    <span className="h-[7px] w-[7px] rounded-full bg-success" aria-hidden="true" />
                    Added to your library · via {word.source === 'llm' ? 'AI' : 'dictionary'}
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {onAddAnother && (
                        <Button variant="ghost" size="sm" onClick={onAddAnother} className="gap-1.5">
                            <Sparkles size={15} aria-hidden="true" />
                            Add another
                        </Button>
                    )}
                    <Link
                        href={detailHref}
                        className={cn(buttonVariants({ variant: 'accent', size: 'sm' }), 'gap-1.5')}
                    >
                        <BookOpen size={15} aria-hidden="true" />
                        View word
                    </Link>
                </div>
            </div>
        </div>
    )
}
