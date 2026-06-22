import { Sparkles, CircleCheck, CircleSlash } from 'lucide-react'
import type { SidequestStats } from '@/lib/domain/sidequest'

export function StatsHeader({ stats }: { stats: SidequestStats }) {
    const tiles = [
        { num: String(stats.xp), label: 'XP', icon: Sparkles, colorClass: 'text-accent' },
        { num: String(stats.completed), label: 'Completed', icon: CircleCheck, colorClass: 'text-success' },
        { num: String(stats.missed), label: 'Missed', icon: CircleSlash, colorClass: 'text-muted-foreground' },
    ]
    return (
        <div className="grid grid-cols-3 gap-3">
            {tiles.map((t) => {
                const Icon = t.icon
                return (
                    <div key={t.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                            <span className="font-display font-semibold text-2xl leading-none">{t.num}</span>
                            <Icon size={20} className={t.colorClass} aria-hidden="true" />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{t.label}</p>
                    </div>
                )
            })}
        </div>
    )
}
