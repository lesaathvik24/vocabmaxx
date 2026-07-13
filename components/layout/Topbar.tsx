'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import { Menu, Sun, Moon, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'
import { useQuickCapture } from '@/components/capture/QuickCaptureProvider'

interface TopbarProps {
    dueCount: number
    userEmail: string
    displayName?: string | null
}

export function Topbar({ dueCount, userEmail, displayName }: TopbarProps) {
    const { theme, setTheme } = useTheme()
    const { openQuickCapture } = useQuickCapture()
    const [mounted, setMounted] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => setMounted(true), [])
    useEffect(() => setSheetOpen(false), [pathname])

    function toggleTheme() {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    const dashboardHref: Route = '/dashboard'

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-4">
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
                <SheetContent side="left" className="p-0 w-64" showCloseButton={false}>
                    <Sidebar dueCount={dueCount} userEmail={userEmail} displayName={displayName} onClose={() => setSheetOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Brand (mobile only) */}
            <Link
                href={dashboardHref}
                className="md:hidden flex items-center gap-2 font-display font-semibold text-sm"
                aria-label="VocabMaxx home"
            >
                <Image src="/logo.png" alt="" width={24} height={24} className="h-6 w-6 rounded-md" priority />
                VocabMaxx
            </Link>

            <div className="flex-1" aria-hidden="true" />

            {/* Theme toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={mounted && theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="min-h-[44px] min-w-[44px]"
            >
                {mounted && theme === 'dark' ? (
                    <Sun size={18} aria-hidden="true" />
                ) : (
                    <Moon size={18} aria-hidden="true" />
                )}
            </Button>

            {/* Add word CTA (hidden on mobile) */}
            <Button
                variant="accent"
                onClick={openQuickCapture}
                className="hidden md:flex gap-1.5"
            >
                <Plus size={16} aria-hidden="true" />
                Add word
                <kbd className="ml-1 hidden lg:inline-flex h-5 items-center rounded border border-accent-foreground/25 px-1.5 font-mono text-[10px] opacity-80">
                    ⌘K
                </kbd>
            </Button>
        </header>
    )
}
