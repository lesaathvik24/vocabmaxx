import Link from 'next/link'
import type { Route } from 'next'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SessionDoneScreenProps {
    count: number
    durationMs: number
    onExit: () => void
}

function formatDuration(ms: number): string {
    const totalSec = Math.round(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return min > 0 ? `${min}m ${sec}s` : `${sec}s`
}

const captureHref: Route = '/capture'

export function SessionDoneScreen({ count, durationMs, onExit }: SessionDoneScreenProps) {
    return (
        <div className="flex flex-col items-center gap-6 py-12 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 size={44} aria-hidden="true" />
            </div>
            <div className="space-y-2">
                <h2 className="font-display font-semibold text-3xl">Session complete</h2>
                <p className="text-muted-foreground text-base max-w-xs">
                    You reviewed {count} {count === 1 ? 'card' : 'cards'} in {formatDuration(durationMs)}.
                    Nice — keep the streak warm.
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Button variant="outline" size="lg" onClick={onExit} className="min-h-[44px]">
                    Back to dashboard
                </Button>
                <Link
                    href={captureHref}
                    className={cn(
                        buttonVariants({ size: 'lg' }),
                        'gap-2 bg-accent text-accent-foreground hover:bg-accent/90 min-h-[44px]',
                    )}
                >
                    <Sparkles size={18} aria-hidden="true" /> Capture a word
                </Link>
            </div>
        </div>
    )
}
