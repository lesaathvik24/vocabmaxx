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
            className="bg-hero-gradient relative overflow-hidden rounded-[20px] p-5 sm:p-6 shadow-[0_18px_40px_-20px_rgba(47,91,234,.7)]"
        >
            <div
                className="pointer-events-none absolute -top-10 -right-8 h-44 w-44 rounded-full bg-white/12"
                aria-hidden="true"
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                        Due now
                    </p>
                    <p className="num font-display font-semibold text-3xl sm:text-[38px] text-white mt-1 leading-tight">
                        {due}{' '}
                        <span className="text-lg sm:text-xl font-medium opacity-85">
                            cards ready to review
                        </span>
                    </p>
                    <p className="flex items-center gap-2 mt-1.5 text-sm text-white/85">
                        <Clock size={15} aria-hidden="true" />
                        About {estMinutes} minutes · spaced just right
                    </p>
                </div>
                <Link
                    href={reviewHref}
                    className={cn(
                        buttonVariants({ size: 'lg' }),
                        'flex-shrink-0 gap-2 h-[46px] px-5 bg-white text-accent hover:bg-white/90 shadow-[0_10px_24px_-10px_rgba(0,0,0,.3)] min-h-[44px]',
                    )}
                >
                    Start review <ArrowRight size={18} aria-hidden="true" />
                </Link>
            </div>
        </div>
    )
}
