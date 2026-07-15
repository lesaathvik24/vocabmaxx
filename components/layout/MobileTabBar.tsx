'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Layers, BookOpen, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuickCapture } from '@/components/capture/QuickCaptureProvider'

interface TabItem {
    label: string
    href: Route
    icon: React.ElementType
}

const LEFT: TabItem[] = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Review', href: '/review', icon: Layers },
]
const RIGHT: TabItem[] = [
    { label: 'Words', href: '/words', icon: BookOpen },
    { label: 'You', href: '/settings', icon: User },
]

function Tab({ item, active }: { item: TabItem; active: boolean }) {
    const Icon = item.icon
    return (
        <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors',
                active ? 'text-accent' : 'text-faint hover:text-foreground',
            )}
        >
            <Icon size={21} aria-hidden="true" />
            {item.label}
        </Link>
    )
}

export function MobileTabBar() {
    const pathname = usePathname()
    const { openQuickCapture } = useQuickCapture()

    return (
        <nav
            aria-label="Primary"
            className="glass-bar fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center px-3 pb-2 md:hidden"
        >
            {LEFT.map((item) => (
                <Tab key={item.label} item={item} active={pathname.startsWith(item.href)} />
            ))}
            <button
                type="button"
                onClick={openQuickCapture}
                aria-label="Add a new word"
                className="mx-1.5 flex h-12 w-12 flex-none items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_8px_18px_-6px_rgba(47,91,234,.7)] active:scale-95 transition-transform"
            >
                <Plus size={24} aria-hidden="true" />
            </button>
            {RIGHT.map((item) => (
                <Tab key={item.label} item={item} active={pathname.startsWith(item.href)} />
            ))}
        </nav>
    )
}
