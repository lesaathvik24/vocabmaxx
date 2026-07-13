'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ParagraphExtractorProps {
    onExtract: (text: string) => Promise<string[]>
    onSaveSelected: (terms: string[]) => Promise<{ added: number; skipped: number; failed: number }>
}

type Phase = 'idle' | 'extracting' | 'candidates' | 'saving' | 'done'

export function ParagraphExtractor({ onExtract, onSaveSelected }: ParagraphExtractorProps) {
    const [text, setText] = useState('')
    const [phase, setPhase] = useState<Phase>('idle')
    const [candidates, setCandidates] = useState<string[]>([])
    const [selected, setSelected] = useState<Set<string>>(new Set())

    async function handleExtract() {
        if (!text.trim()) return
        setPhase('extracting')
        try {
            const terms = await onExtract(text.trim())
            setCandidates(terms)
            setSelected(new Set(terms))
            setPhase(terms.length > 0 ? 'candidates' : 'idle')
            if (terms.length === 0) toast.info('No new candidates found in that text.')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Extraction failed')
            setPhase('idle')
        }
    }

    async function handleSave() {
        const terms = [...selected]
        if (terms.length === 0) return
        setPhase('saving')
        try {
            const result = await onSaveSelected(terms)
            toast.success(
                `Saved ${result.added} word${result.added !== 1 ? 's' : ''}` +
                (result.skipped > 0 ? `, ${result.skipped} skipped` : '') +
                (result.failed > 0 ? `, ${result.failed} failed` : ''),
            )
            setPhase('done')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Save failed')
            setPhase('candidates')
        }
    }

    function toggleTerm(term: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(term)) next.delete(term)
            else next.add(term)
            return next
        })
    }

    function reset() {
        setText('')
        setCandidates([])
        setSelected(new Set())
        setPhase('idle')
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="paragraph-input">Paste text</Label>
                <textarea
                    id="paragraph-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    disabled={phase === 'extracting' || phase === 'saving'}
                    placeholder="Paste any text — article, book passage, transcript…"
                    className={cn(
                        'w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm',
                        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                    aria-describedby="paragraph-hint"
                />
                <p id="paragraph-hint" className="text-xs text-muted-foreground">
                    The AI will extract vocabulary-worthy words from your text.
                </p>
            </div>

            {phase === 'idle' || phase === 'done' ? (
                <div className="flex gap-2">
                    <Button
                        onClick={handleExtract}
                        disabled={!text.trim()}
                        variant="accent"
                        className="min-h-[44px]"
                    >
                        Extract candidates
                    </Button>
                    {phase === 'done' && (
                        <Button variant="outline" onClick={reset} className="min-h-[44px]">
                            Start over
                        </Button>
                    )}
                </div>
            ) : phase === 'extracting' ? (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        Extracting candidates…
                    </p>
                    <div className="space-y-2 max-h-72">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                            {candidates.length} candidates found
                        </span>
                        <div className="flex gap-2 text-xs">
                            <button
                                onClick={() => setSelected(new Set(candidates))}
                                className="text-accent hover:underline focus-visible:outline-none"
                            >
                                All
                            </button>
                            <span className="text-muted-foreground">/</span>
                            <button
                                onClick={() => setSelected(new Set())}
                                className="text-muted-foreground hover:underline focus-visible:outline-none"
                            >
                                None
                            </button>
                        </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                        <ul className="p-2 space-y-1">
                            {candidates.map((term) => (
                                <li key={term}>
                                    <label className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-muted min-h-[44px]">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(term)}
                                            onChange={() => toggleTerm(term)}
                                            className="h-4 w-4 accent-accent rounded border-border"
                                        />
                                        <span className="text-sm">{term}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={selected.size === 0 || phase === 'saving'}
                        variant="accent"
                        className="min-h-[44px] gap-2"
                    >
                        {phase === 'saving' ? (
                            <>
                                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                                Saving…
                            </>
                        ) : (
                            `Save ${selected.size} selected`
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
