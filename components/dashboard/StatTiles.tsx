import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface DashboardStats {
    learned: number
    streakDays: number
    retention: number
    due: number
    xp: number
    weekDone: number
    weekGoal: number
    history: number[]
}

interface StatTilesProps {
    stats: DashboardStats | null
    loading?: boolean
}

interface TileData {
    num: string
    label: string
    colorClass: string
}

function buildTiles(stats: DashboardStats): TileData[] {
    return [
        {
            num: String(stats.learned),
            label: 'Words learned',
            colorClass: 'text-foreground',
        },
        {
            num: `${stats.streakDays}d`,
            label: 'Current streak',
            colorClass: 'text-warning',
        },
        {
            num: `${Math.round(stats.retention * 100)}%`,
            label: 'Retention',
            colorClass: 'text-success',
        },
        {
            num: String(stats.xp),
            label: 'Sidequest XP',
            colorClass: 'text-accent',
        },
    ]
}

export function StatTiles({ stats, loading = false }: StatTilesProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
        )
    }

    if (!stats) return null

    const tiles = buildTiles(stats)

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tiles.map((tile) => (
                <div
                    key={tile.label}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                    <span className={cn('num font-display font-semibold text-[28px] leading-none tracking-tight', tile.colorClass)}>
                        {tile.num}
                    </span>
                    <p className="mt-1.5 text-[12.5px] text-slate-2">{tile.label}</p>
                </div>
            ))}
        </div>
    )
}
