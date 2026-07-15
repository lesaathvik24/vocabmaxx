import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export interface ProblemWord {
    id: string
    term: string
    definition: string
    lapses: number
    reviews: number
}

interface ProblemWordsProps {
    words: ProblemWord[]
}

export function ProblemWords({ words }: ProblemWordsProps) {
    return (
        <section className="rounded-[18px] border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-warning" aria-hidden="true" />
                <h2 className="font-display text-lg font-semibold">Problem words</h2>
            </div>

            {words.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    No trouble spots yet — words you keep missing will surface here.
                </p>
            ) : (
                <ul className="divide-y divide-border">
                    {words.map((w) => (
                        <li key={w.id}>
                            <Link
                                href={`/words/${w.id}`}
                                className="flex items-center gap-3 py-2.5 outline-none hover:bg-muted/40 focus-visible:bg-muted/40"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{w.term}</p>
                                    <p className="truncate text-xs text-muted-foreground">{w.definition}</p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-sm font-semibold text-destructive tabular-nums">
                                        {w.lapses} miss{w.lapses === 1 ? '' : 'es'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground tabular-nums">
                                        of {w.reviews} review{w.reviews === 1 ? '' : 's'}
                                    </p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
