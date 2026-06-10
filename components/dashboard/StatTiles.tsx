import { BookOpen, Flame, Target, Layers } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export interface DashboardStats {
    learned: number
    streakDays: number
    retention: number
    due: number
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
    icon: React.ElementType
    colorClass: string
}

function buildTiles(stats: DashboardStats): TileData[] {
    return [
        {
            num: String(stats.learned),
            label: 'Words learned',
            icon: BookOpen,
            colorClass: 'text-muted-foreground',
        },
        {
            num: `${stats.streakDays}d`,
            label: 'Current streak',
            icon: Flame,
            colorClass: 'text-warning',
        },
        {
            num: `${Math.round(stats.retention * 100)}%`,
            label: 'Retention',
            icon: Target,
            colorClass: 'text-success',
        },
        {
            num: String(stats.due),
            label: 'Due today',
            icon: Layers,
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
            {tiles.map((tile) => {
                const Icon = tile.icon
                return (
                    <div
                        key={tile.label}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <span className="font-display font-semibold text-2xl leading-none">
                                {tile.num}
                            </span>
                            <Icon size={20} className={tile.colorClass} aria-hidden="true" />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{tile.label}</p>
                    </div>
                )
            })}
        </div>
    )
}
