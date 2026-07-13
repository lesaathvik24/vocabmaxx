import { cn } from '@/lib/utils'

interface EmptyStateProps {
    icon: React.ReactNode
    title: string
    body: string
    /** Buttons / links rendered under the body. */
    actions?: React.ReactNode
    /** 'page' centers in ~60vh for full-page empties; 'card' is compact for embedding. */
    variant?: 'page' | 'card'
    tone?: 'default' | 'success'
    className?: string
}

export function EmptyState({
    icon,
    title,
    body,
    actions,
    variant = 'card',
    tone = 'default',
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center px-6 text-center',
                variant === 'page' ? 'min-h-[60vh]' : 'py-12',
                className,
            )}
        >
            <div
                className={cn(
                    'mb-5 flex h-16 w-16 items-center justify-center rounded-2xl',
                    tone === 'success' ? 'bg-success/10 text-success' : 'bg-accent-soft text-accent',
                )}
            >
                {icon}
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
            {actions && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
            )}
        </div>
    )
}
