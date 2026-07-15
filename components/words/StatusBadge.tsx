import { cn } from '@/lib/utils'
import type { WordStatus } from '@/lib/words/filter'

const STATUS_STYLES: Record<WordStatus, string> = {
    new: 'bg-warn-wash text-warning',
    learning: 'bg-accent-soft text-accent',
    review: 'bg-accent-soft text-accent',
    mastered: 'bg-success-wash text-success',
}

/** Bar fill color per status, for the memory-strength meter. */
export const STATUS_BAR: Record<WordStatus, string> = {
    new: 'bg-warning',
    learning: 'bg-accent',
    review: 'bg-accent',
    mastered: 'bg-success',
}

/** Coarse memory strength (%) derived from SRS status, for the meter width. */
export function statusStrength(status: WordStatus): number {
    switch (status) {
        case 'new':
            return 22
        case 'learning':
            return 48
        case 'review':
            return 70
        case 'mastered':
            return 92
    }
}

export function StatusBadge({ status, className }: { status: WordStatus; className?: string }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold capitalize',
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
                'num inline-flex items-center gap-1.5 rounded-full bg-warn-wash px-2.5 py-1 text-[11.5px] font-semibold text-warning',
                className,
            )}
        >
            Due today
        </span>
    )
}

/** Memory-strength meter: 6px track, fill colored + sized by status. */
export function MemoryBar({ status, className }: { status: WordStatus; className?: string }) {
    return (
        <div className={cn('h-1.5 overflow-hidden rounded-full bg-line-2', className)} aria-hidden="true">
            <div
                className={cn('h-full rounded-full', STATUS_BAR[status])}
                style={{ width: `${statusStrength(status)}%` }}
            />
        </div>
    )
}
