'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-react'
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
import { WordEditor } from './WordEditor'
import type { WordStatus } from '@/lib/words/filter'

export interface WordDetailProps {
    id: string
    term: string
    definition: string
    examples: string[]
    source: string
    addedAt: string // ISO
    status: WordStatus
    due: boolean
    srs: {
        easeFactor: number
        intervalDays: number
        repetitions: number
        dueDate: string // ISO
        lastReviewedAt: string | null // ISO
    } | null
    history: { grade: number; reviewedAt: string }[]
}

const STATUS_STYLES: Record<WordStatus, string> = {
    new: 'bg-muted text-muted-foreground',
    learning: 'bg-warning/15 text-warning',
    review: 'bg-accent-soft text-accent',
    mastered: 'bg-success/15 text-success',
}

const GRADE_META: Record<number, { label: string; cls: string }> = {
    0: { label: 'Again', cls: 'text-destructive' },
    3: { label: 'Hard', cls: 'text-warning' },
    4: { label: 'Good', cls: 'text-accent' },
    5: { label: 'Easy', cls: 'text-success' },
}

function fmtDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function WordDetail(props: WordDetailProps) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    async function confirmDelete() {
        setDeleting(true)
        try {
            const res = await fetch(`/api/words/${props.id}`, { method: 'DELETE' })
            if (!res.ok) {
                toast.error(`Couldn't delete "${props.term}". Try again.`)
                return
            }
            toast.success(`Deleted "${props.term}".`)
            router.push('/words')
            router.refresh()
        } catch {
            toast.error('Network error. Word was not deleted.')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Link
                href="/words"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft size={16} aria-hidden="true" /> Back to words
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <h1 className="font-display font-semibold text-3xl tracking-tight">{props.term}</h1>
                        <span
                            className={cn(
                                'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                                STATUS_STYLES[props.status],
                            )}
                        >
                            {props.status}
                        </span>
                        {props.due && (
                            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                                Due
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Captured {fmtDate(props.addedAt)} · via {props.source}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                        <Pencil size={15} aria-hidden="true" /> Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmingDelete(true)}
                        className="gap-1.5 text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 size={15} aria-hidden="true" /> Delete
                    </Button>
                </div>
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Definition
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed">{props.definition}</p>
                </div>
                {props.examples.length > 0 && (
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Examples
                        </h2>
                        <ul className="mt-1 space-y-1.5">
                            {props.examples.map((ex, i) => (
                                <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                                    “{ex}”
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Repetitions" value={props.srs ? String(props.srs.repetitions) : '0'} />
                <Stat label="Interval" value={props.srs ? `${props.srs.intervalDays}d` : '—'} />
                <Stat
                    label="Ease"
                    value={props.srs ? props.srs.easeFactor.toFixed(2) : '—'}
                />
                <Stat label="Next due" value={fmtDate(props.srs?.dueDate ?? null)} />
            </section>

            <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Review history
                </h2>
                {props.history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviews yet.</p>
                ) : (
                    <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        {props.history.map((h, i) => {
                            const meta = GRADE_META[h.grade] ?? { label: `Grade ${h.grade}`, cls: '' }
                            return (
                                <li
                                    key={i}
                                    className={cn(
                                        'flex items-center justify-between px-4 py-2.5 text-sm',
                                        i > 0 && 'border-t border-border',
                                    )}
                                >
                                    <span className={cn('font-medium', meta.cls)}>{meta.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(h.reviewedAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            <WordEditor
                wordId={props.id}
                term={props.term}
                definition={props.definition}
                examples={props.examples}
                open={editing}
                onOpenChange={setEditing}
            />

            <Dialog open={confirmingDelete} onOpenChange={(o) => !deleting && setConfirmingDelete(o)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this word?</DialogTitle>
                        <DialogDescription>
                            “{props.term}” and its review history will be permanently removed. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
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

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    )
}
