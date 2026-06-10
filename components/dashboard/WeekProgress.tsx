import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from './StatTiles'

interface WeekProgressProps {
    stats: DashboardStats | null
    loading?: boolean
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function WeekProgress({ stats, loading = false }: WeekProgressProps) {
    if (loading) {
        return (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
                <div className="flex gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} className="flex-1 h-10 rounded" />
                    ))}
                </div>
            </div>
        )
    }

    if (!stats) return null

    const pct = stats.weekGoal > 0 ? Math.round((stats.weekDone / stats.weekGoal) * 100) : 0
    const max = Math.max(...stats.history, 1)

    return (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm flex flex-col">
            <div className="flex items-baseline justify-between">
                <span className="font-semibold text-sm">This week</span>
                <span className="font-mono text-xs text-muted-foreground">
                    {stats.weekDone}/{stats.weekGoal}
                </span>
            </div>

            {/* progress bar */}
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${pct}% of weekly goal`}
                />
            </div>

            {/* sparkline */}
            <div className="mt-5 flex gap-1 items-end" aria-hidden="true">
                {stats.history.slice(0, 7).map((v, i) => {
                    const heightPct = Math.max((v / max) * 100, 8)
                    const isToday = i === stats.history.length - 1
                    return (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                            <div className="w-full flex items-end h-11">
                                <div
                                    className={`w-full rounded-sm ${isToday ? 'bg-accent' : 'bg-muted-foreground/30'}`}
                                    style={{ height: `${heightPct}%` }}
                                />
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">
                                {DAY_LABELS[i]}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
