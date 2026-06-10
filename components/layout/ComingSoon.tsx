import Link from 'next/link'
import type { Route } from 'next'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ComingSoonProps {
    icon: LucideIcon
    title: string
    body: string
    ctaLabel?: string
    ctaHref?: Route
}

export function ComingSoon({
    icon: Icon,
    title,
    body,
    ctaLabel = 'Capture a word',
    ctaHref = '/capture' as Route,
}: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[60vh] px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent mb-5">
                <Icon size={28} aria-hidden="true" />
            </div>
            <h1 className="font-display font-semibold text-2xl tracking-tight">{title}</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">{body}</p>
            <Link
                href={ctaHref}
                className={cn(
                    buttonVariants(),
                    'mt-6 bg-accent text-accent-foreground hover:bg-accent/90 gap-2',
                )}
            >
                {ctaLabel}
                <ArrowRight size={16} aria-hidden="true" />
            </Link>
        </div>
    )
}
