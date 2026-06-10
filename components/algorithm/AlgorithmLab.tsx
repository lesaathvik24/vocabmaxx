'use client'

import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { nextState, initialSRSState, type SRSState } from '@/lib/domain/srs'
import { Grade } from '@/lib/domain/grade'

interface Step {
    n: number
    gradeLabel: string
    intervalDays: number
    easeFactor: number
    repetitions: number
    dueInDays: number
}

const GRADE_OPTIONS: { grade: Grade; label: string; cls: string }[] = [
    { grade: Grade.Again, label: 'Again', cls: 'border-destructive/50 text-destructive hover:bg-destructive/10' },
    { grade: Grade.Hard, label: 'Hard', cls: 'border-warning/50 text-warning hover:bg-warning/10' },
    { grade: Grade.Good, label: 'Good', cls: 'border-accent/50 text-accent hover:bg-accent/10' },
    { grade: Grade.Easy, label: 'Easy', cls: 'border-success/50 text-success hover:bg-success/10' },
]

const ANCHOR = new Date('2026-01-01T00:00:00.000Z')

export function AlgorithmLab() {
    const [state, setState] = useState<SRSState>(initialSRSState)
    const [history, setHistory] = useState<Step[]>([])

    function apply(grade: Grade, label: string) {
        const result = nextState(state, grade, ANCHOR)
        setState(result.state)
        setHistory((h) => [
            ...h,
            {
                n: h.length + 1,
                gradeLabel: label,
                intervalDays: result.state.intervalDays,
                easeFactor: result.state.easeFactor,
                repetitions: result.state.repetitions,
                dueInDays: Math.round((result.dueDate.getTime() - ANCHOR.getTime()) / 86_400_000),
            },
        ])
    }

    function reset() {
        setState(initialSRSState)
        setHistory([])
    }

    // Live preview: what each grade would produce from the CURRENT state.
    const previews = useMemo(
        () =>
            GRADE_OPTIONS.map((g) => {
                const r = nextState(state, g.grade, ANCHOR)
                return { ...g, interval: r.state.intervalDays, ease: r.state.easeFactor }
            }),
        [state],
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display font-semibold text-2xl sm:text-3xl">Algorithm lab</h1>
                <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                    This runs the exact SM-2 function the app uses (
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">nextState()</code>) entirely in your
                    browser. Press a grade to see how the interval, ease factor, and next due date evolve. Nothing
                    here touches your real words or schedule.
                </p>
            </div>

            {/* Current state */}
            <div className="grid grid-cols-3 gap-3">
                <Stat label="Interval (days)" value={String(state.intervalDays)} />
                <Stat label="Ease factor" value={state.easeFactor.toFixed(2)} />
                <Stat label="Repetitions" value={String(state.repetitions)} />
            </div>

            {/* Grade buttons with live preview */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {previews.map((p) => (
                    <button
                        key={p.grade}
                        onClick={() => apply(p.grade, p.label)}
                        className={cn(
                            'flex flex-col items-center gap-0.5 rounded-xl border bg-card px-2 py-3',
                            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            p.cls,
                        )}
                    >
                        <span className="text-sm font-semibold">{p.label}</span>
                        <span className="text-[11px] opacity-70">
                            → {p.interval}d · ef {p.ease.toFixed(2)}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={reset} className="gap-2" disabled={history.length === 0}>
                    <RotateCcw size={14} aria-hidden="true" /> Reset
                </Button>
            </div>

            {/* History table */}
            {history.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                                <th className="px-3 py-2 font-medium">#</th>
                                <th className="px-3 py-2 font-medium">Grade</th>
                                <th className="px-3 py-2 font-medium">Interval</th>
                                <th className="px-3 py-2 font-medium">Ease</th>
                                <th className="px-3 py-2 font-medium">Reps</th>
                                <th className="px-3 py-2 font-medium">Due in</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((s) => (
                                <tr key={s.n} className="border-b border-border last:border-0">
                                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.n}</td>
                                    <td className="px-3 py-2 font-medium">{s.gradeLabel}</td>
                                    <td className="px-3 py-2">{s.intervalDays}d</td>
                                    <td className="px-3 py-2 font-mono text-xs">{s.easeFactor.toFixed(2)}</td>
                                    <td className="px-3 py-2">{s.repetitions}</td>
                                    <td className="px-3 py-2">{s.dueInDays}d</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
        </div>
    )
}
