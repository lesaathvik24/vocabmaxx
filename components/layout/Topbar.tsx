'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import { Menu, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'
import { useQuickCapture } from '@/components/capture/QuickCaptureProvider'

interface TopbarProps {
    dueCount: number
    userEmail: string
    displayName?: string | null
}

function initialsFromEmail(email: string): string {
    const local = email.split('@')[0] ?? ''
    const parts = local.split(/[._-]/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return local.slice(0, 2).toUpperCase() || 'U'
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return 'U'
}

export function Topbar({ dueCount, userEmail, displayName }: TopbarProps) {
    const { openQuickCapture } = useQuickCapture()
    const [sheetOpen, setSheetOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => setSheetOpen(false), [pathname])

    const dashboardHref: Route = '/dashboard'
    const wordsHref: Route = '/words'
    const settingsHref: Route = '/settings'
    const avatar = displayName ? initials(displayName) : initialsFromEmail(userEmail)

    return (
        <header className="glass-bar sticky top-0 z-30 flex h-14 items-center gap-3 px-4">
            {/* Mobile hamburger — SheetTrigger renders a native <button> */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger
                    className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'md:hidden min-h-[44px] min-w-[44px]',
                    )}
                    aria-label="Open navigation menu"
                >
                    <Menu size={20} aria-hidden="true" />
                </SheetTrigger>
                <SheetContent
                    side="left"
                    showCloseButton={false}
                    className="gap-0 p-0 w-[214px] max-w-[214px] data-[side=left]:w-[214px] data-[side=left]:sm:max-w-[214px]"
                >
                    <Sidebar dueCount={dueCount} userEmail={userEmail} displayName={displayName} onClose={() => setSheetOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Brand (mobile only — sidebar carries it on desktop) */}
            <Link
                href={dashboardHref}
                className="md:hidden flex items-center gap-2 font-display font-semibold text-sm"
                aria-label="VocabMaxx home"
            >
                <span className="bg-logo-gradient flex h-6 w-6 items-center justify-center rounded-lg text-[13px] font-bold text-white">
                    V
                </span>
                VocabMaxx
            </Link>

            <div className="flex-1" aria-hidden="true" />

            {/* Search (desktop) */}
            <Link
                href={wordsHref}
                className="hidden md:flex h-9 w-56 items-center gap-2 rounded-lg bg-muted px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/70"
            >
                <Search size={15} aria-hidden="true" />
                Search words
            </Link>

            {/* Add word CTA */}
            <button
                type="button"
                onClick={openQuickCapture}
                className={cn(
                    buttonVariants({ variant: 'accent', size: 'default' }),
                    'hidden md:inline-flex h-9 gap-1.5 px-3 shadow-[0_6px_16px_-6px_rgba(47,91,234,.6)]',
                )}
            >
                <Plus size={15} aria-hidden="true" />
                Add word
                <kbd className="ml-0.5 hidden lg:inline-flex h-5 items-center rounded bg-white/20 px-1.5 font-mono text-[10px]">
                    ⌘K
                </kbd>
            </button>

            {/* Avatar */}
            <Link
                href={settingsHref}
                aria-label="Your account"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[13px] font-bold text-accent"
                style={{ background: 'radial-gradient(circle at 30% 30%, #c9d4f5, #9db0e8)' }}
            >
                {avatar}
            </Link>
        </header>
    )
}
