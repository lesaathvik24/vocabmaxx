'use client'

import { useMemo, useState } from 'react'
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

export interface WordRow {
    id: string
    term: string
    definition: string
    source: string
    addedAt: string // ISO
}

interface WordsListProps {
    words: WordRow[]
}

export function WordsList({ words }: WordsListProps) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [pending, setPending] = useState<WordRow | null>(null)
    const [deleting, setDeleting] = useState(false)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return words
        return words.filter(
            (w) => w.term.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q),
        )
    }, [words, query])

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
            <div className="relative">
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

            {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                    {words.length === 0 ? 'No words captured yet.' : 'No words match your search.'}
                </p>
            ) : (
                <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {filtered.map((word, i) => (
                        <li
                            key={word.id}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3',
                                i > 0 && 'border-t border-border',
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{word.term}</p>
                                <p className="truncate text-xs text-muted-foreground">{word.definition}</p>
                            </div>
                            <span className="hidden flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
                                {word.source}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Delete ${word.term}`}
                                onClick={() => setPending(word)}
                                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 size={16} aria-hidden="true" />
                            </Button>
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
                        <Button
                            variant="outline"
                            onClick={() => setPending(null)}
                            disabled={deleting}
                        >
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
