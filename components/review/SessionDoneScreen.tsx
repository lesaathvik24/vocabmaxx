import Link from 'next/link'
import type { Route } from 'next'
import { CheckCircle2, Sparkles, RotateCcw } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SessionDoneScreenProps {
    count: number
    durationMs: number
    /** Whether the just-finished session was a practice (cram) run. */
    practice?: boolean
    onExit: () => void
    /** Restart the same session in-place (used by practice "Keep reviewing"). */
    onRestart: () => void
}

function formatDuration(ms: number): string {
    const totalSec = Math.round(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return min > 0 ? `${min}m ${sec}s` : `${sec}s`
}

const captureHref: Route = '/capture'
const practiceHref = '/review?mode=practice' as Route

export function SessionDoneScreen({ count, durationMs, practice = false, onExit, onRestart }: SessionDoneScreenProps) {
    return (
        <div className="flex flex-col items-center gap-6 py-12 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 size={44} aria-hidden="true" />
            </div>
            <div className="space-y-2">
                <h2 className="font-display font-semibold text-3xl">
                    {practice ? 'Practice complete' : 'Session complete'}
                </h2>
                <p className="text-muted-foreground text-base max-w-xs">
                    You reviewed {count} {count === 1 ? 'card' : 'cards'} in {formatDuration(durationMs)}.
                    {practice ? ' Schedule untouched — practice as often as you like.' : ' Nice — keep the streak warm.'}
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Button variant="outline" size="lg" onClick={onExit} className="min-h-[44px]">
                    Back to dashboard
                </Button>
                {practice ? (
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onRestart}
                        className="gap-2 min-h-[44px]"
                    >
                        <RotateCcw size={18} aria-hidden="true" /> Keep reviewing
                    </Button>
                ) : (
                    <Link
                        href={practiceHref}
                        className={cn(
                            buttonVariants({ variant: 'outline', size: 'lg' }),
                            'gap-2 min-h-[44px]',
                        )}
                    >
                        <RotateCcw size={18} aria-hidden="true" /> Keep reviewing
                    </Link>
                )}
                <Link
                    href={captureHref}
                    className={cn(
                        buttonVariants({ variant: 'accent', size: 'lg' }),
                        'gap-2 min-h-[44px]',
                    )}
                >
                    <Sparkles size={18} aria-hidden="true" /> Capture a word
                </Link>
            </div>
        </div>
    )
}
