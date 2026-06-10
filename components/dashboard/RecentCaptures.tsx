import Link from 'next/link'
import type { Route } from 'next'
import { ArrowRight, BookOpen } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type WordStatus = 'new' | 'learning' | 'review' | 'mastered'

export interface CapturedWord {
    id: string
    term: string
    definition: string
    status: WordStatus
    source: string
    capturedAt: Date
}

interface RecentCapturesProps {
    words: CapturedWord[]
    loading?: boolean
}

const STATUS_DOT: Record<WordStatus, string> = {
    new: 'bg-muted-foreground',
    learning: 'bg-warning',
    review: 'bg-accent',
    mastered: 'bg-success',
}

function formatRelative(date: Date): string {
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 60) return `${diffMin}m`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h`
    return `${Math.floor(diffHr / 24)}d`
}

const captureHref: Route = '/capture'
const wordsHref: Route = '/words'

export function RecentCaptures({ words, loading = false }: RecentCapturesProps) {
    if (loading) {
        return (
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-14" />
                </div>
                <div className="px-2 pb-2 space-y-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-3">
                            <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-3.5 w-24" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (words.length === 0) {
        return (
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <span className="font-semibold text-sm">Recent captures</span>
                </div>
                <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
                    <BookOpen size={36} className="text-muted-foreground" aria-hidden="true" />
                    <p className="font-semibold text-sm">No words yet</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                        Start building your vocabulary by capturing your first word.
                    </p>
                    <Link
                        href={captureHref}
                        className={cn(
                            buttonVariants({ size: 'sm' }),
                            'mt-1 bg-accent text-accent-foreground hover:bg-accent/90',
                        )}
                    >
                        Capture your first word
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <span className="font-semibold text-sm">Recent captures</span>
                <Link
                    href={wordsHref}
                    className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'h-8 px-2 text-xs text-muted-foreground gap-1',
                    )}
                >
                    View all <ArrowRight size={13} aria-hidden="true" />
                </Link>
            </div>
            <ul className="px-2 pb-2">
                {words.slice(0, 6).map((word) => (
                    <li key={word.id}>
                        <Link
                            href={`/words/${word.id}` as Route}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px]',
                                'hover:bg-muted transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            )}
                        >
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-full flex-shrink-0',
                                    STATUS_DOT[word.status],
                                )}
                                title={word.status}
                                aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{word.term}</p>
                                <p className="text-xs text-muted-foreground truncate">{word.definition}</p>
                            </div>
                            <span className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                                {word.source}
                            </span>
                            <span className="hidden sm:block font-mono text-[11px] text-muted-foreground w-8 text-right flex-shrink-0">
                                {formatRelative(word.capturedAt)}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
