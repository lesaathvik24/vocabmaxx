import { cn } from '@/lib/utils'
import type { WordStatus } from '@/lib/words/filter'

const STATUS_STYLES: Record<WordStatus, string> = {
    new: 'bg-muted text-muted-foreground',
    learning: 'bg-warning/15 text-warning',
    review: 'bg-accent-soft text-accent',
    mastered: 'bg-success/15 text-success',
}

export function StatusBadge({ status, className }: { status: WordStatus; className?: string }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                STATUS_STYLES[status],
                className,
            )}
        >
            {status}
        </span>
    )
}

export function DueBadge({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent',
                className,
            )}
        >
            Due
        </span>
    )
}
