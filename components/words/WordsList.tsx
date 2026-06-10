'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, Trash2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { filterWords, type WordStatus, type WordFilter } from '@/lib/words/filter'

export interface WordRow {
    id: string
    term: string
    definition: string
    source: string
    addedAt: string // ISO
    status: WordStatus
    due: boolean
}

interface WordsListProps {
    words: WordRow[]
}

// Above this many rows we window the list (render only the visible slice) so
// large libraries (250+ words) scroll without laying out every node.
const VIRTUALIZE_THRESHOLD = 50
const ROW_HEIGHT = 68 // px, must match the row's rendered height
const VIEWPORT_HEIGHT = 640 // px scroll container
const OVERSCAN = 6 // extra rows above/below the viewport

const FILTERS: { id: WordFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'due', label: 'Due' },
    { id: 'mastered', label: 'Mastered' },
]

const STATUS_STYLES: Record<WordStatus, string> = {
    new: 'bg-muted text-muted-foreground',
    learning: 'bg-warning/15 text-warning',
    review: 'bg-accent-soft text-accent',
    mastered: 'bg-success/15 text-success',
}

export function WordsList({ words }: WordsListProps) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState<WordFilter>('all')
    const [pending, setPending] = useState<WordRow | null>(null)
    const [deleting, setDeleting] = useState(false)

    const filtered = useMemo(
        () => filterWords(words, { query, filter }),
        [words, query, filter],
    )

    async function confirmDelete() {
        if (!pending) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/words/${pending.id}`, { method: 'DELETE' })
            if (!res.ok) {
                toast.error(`Couldn't delete "${pending.term}". Try again.`)
                return
            }
            toast.success(`Deleted "${pending.term}".`)
            setPending(null)
            router.refresh()
        } catch {
            toast.error('Network error. Word was not deleted.')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search your words…"
                        className="pl-9"
                        aria-label="Search words"
                    />
                </div>
                <div
                    role="tablist"
                    aria-label="Filter words"
                    className="inline-flex rounded-lg border border-border bg-card p-0.5"
                >
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            role="tab"
                            aria-selected={filter === f.id}
                            onClick={() => setFilter(f.id)}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                filter === f.id
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                    {words.length === 0
                        ? 'No words captured yet.'
                        : 'No words match your search or filter.'}
                </p>
            ) : filtered.length > VIRTUALIZE_THRESHOLD ? (
                <VirtualRows rows={filtered} onDelete={setPending} onOpen={(id) => router.push(`/words/${id}`)} />
            ) : (
                <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {filtered.map((word, i) => (
                        <li key={word.id} className={cn(i > 0 && 'border-t border-border')}>
                            <WordRowItem
                                word={word}
                                onDelete={() => setPending(word)}
                                onOpen={() => router.push(`/words/${word.id}`)}
                            />
                        </li>
                    ))}
                </ul>
            )}

            <Dialog
                open={pending !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPending(null)
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this word?</DialogTitle>
                        <DialogDescription>
                            {pending
                                ? `"${pending.term}" and its review history will be permanently removed. This cannot be undone.`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPending(null)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="gap-2 bg-destructive text-white hover:bg-destructive/90"
                        >
                            {deleting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

/** A single word row: clickable (opens detail) with a delete affordance. */
function WordRowItem({
    word,
    onDelete,
    onOpen,
}: {
    word: WordRow
    onDelete: () => void
    onOpen: () => void
}) {
    return (
        <div
            role="link"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpen()
                }
            }}
            style={{ height: ROW_HEIGHT }}
            className="flex cursor-pointer items-center gap-3 px-4 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
        >
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{word.term}</p>
                <p className="truncate text-xs text-muted-foreground">{word.definition}</p>
            </div>
            <span
                className={cn(
                    'hidden flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize sm:inline-flex',
                    STATUS_STYLES[word.status],
                )}
            >
                {word.status}
            </span>
            {word.due && (
                <span className="flex-shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                    Due
                </span>
            )}
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${word.term}`}
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                }}
                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
            >
                <Trash2 size={16} aria-hidden="true" />
            </Button>
        </div>
    )
}

/**
 * Minimal windowed list. Renders only the rows intersecting the viewport (plus
 * an overscan margin), positioned absolutely inside a spacer of the full height.
 * Avoids a dependency while keeping 250+ row lists smooth.
 */
function VirtualRows({
    rows,
    onDelete,
    onOpen,
}: {
    rows: WordRow[]
    onDelete: (w: WordRow) => void
    onOpen: (id: string) => void
}) {
    const [scrollTop, setScrollTop] = useState(0)
    const ref = useRef<HTMLDivElement>(null)

    const total = rows.length * ROW_HEIGHT
    const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2
    const last = Math.min(rows.length, first + visibleCount)
    const slice = rows.slice(first, last)

    return (
        <div
            ref={ref}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            style={{ height: VIEWPORT_HEIGHT }}
            className="overflow-auto rounded-2xl border border-border bg-card shadow-sm"
        >
            <div style={{ height: total, position: 'relative' }}>
                {slice.map((word, i) => {
                    const index = first + i
                    return (
                        <div
                            key={word.id}
                            style={{
                                position: 'absolute',
                                top: index * ROW_HEIGHT,
                                left: 0,
                                right: 0,
                                borderTop: index > 0 ? '1px solid var(--border)' : undefined,
                            }}
                        >
                            <WordRowItem
                                word={word}
                                onDelete={() => onDelete(word)}
                                onOpen={() => onOpen(word.id)}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
