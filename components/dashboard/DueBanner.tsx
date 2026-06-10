import Link from 'next/link'
import type { Route } from 'next'
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DueBannerProps {
    due: number
    estMinutes?: number
}

const reviewHref: Route = '/review'

export function DueBanner({ due, estMinutes = 4 }: DueBannerProps) {
    if (due === 0) {
        return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircle2 size={28} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-lg leading-tight">All caught up</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Nothing due right now. Capture a new word or get ahead.
                    </p>
                </div>
                <Link
                    href={reviewHref}
                    className={cn(buttonVariants({ variant: 'outline' }), 'flex-shrink-0')}
                >
                    Review ahead
                </Link>
            </div>
        )
    }

    return (
        <div
            role="region"
            aria-label="Cards due for review"
            className="relative overflow-hidden rounded-2xl bg-accent p-4 sm:p-6 shadow-sm"
        >
            <div
                className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent-foreground/5"
                aria-hidden="true"
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-foreground/70">
                        Due now
                    </p>
                    <p className="font-display font-semibold text-3xl sm:text-4xl text-accent-foreground mt-1 leading-none">
                        {due}{' '}
                        <span className="text-lg sm:text-2xl font-medium opacity-75">
                            cards ready to review
                        </span>
                    </p>
                    <p className="flex items-center gap-2 mt-2 text-sm text-accent-foreground/80">
                        <Clock size={15} aria-hidden="true" />
                        About {estMinutes} minutes · spaced just right
                    </p>
                </div>
                <Link
                    href={reviewHref}
                    className={cn(
                        buttonVariants({ size: 'lg' }),
                        'flex-shrink-0 gap-2 bg-accent-foreground text-accent hover:bg-accent-foreground/90 min-h-[44px]',
                    )}
                >
                    Start review <ArrowRight size={18} aria-hidden="true" />
                </Link>
            </div>
        </div>
    )
}
