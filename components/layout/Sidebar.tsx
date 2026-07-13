'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Layers,
    PlusCircle,
    BookOpen,
    BarChart3,
    FlaskConical,
    Sliders,
    Target,
    X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { UserMenu } from './UserMenu'

interface NavItem {
    id: string
    label: string
    href: Route
    icon: React.ElementType
    badge?: 'due'
}

interface NavGroup {
    label: string
    items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Learn',
        items: [
            { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { id: 'review', label: 'Review', href: '/review', icon: Layers, badge: 'due' },
            { id: 'sidequests', label: 'Sidequests', href: '/sidequests', icon: Target },
        ],
    },
    {
        label: 'Library',
        items: [
            { id: 'capture', label: 'Capture', href: '/capture', icon: PlusCircle },
            { id: 'words', label: 'Words', href: '/words', icon: BookOpen },
        ],
    },
    {
        label: 'Analyze',
        items: [
            { id: 'insights', label: 'Insights', href: '/insights', icon: BarChart3 },
            { id: 'algorithm', label: 'Algorithm lab', href: '/algorithm', icon: FlaskConical },
        ],
    },
]

interface SidebarProps {
    dueCount: number
    userEmail: string
    displayName?: string | null
    onClose?: () => void
}

export function Sidebar({ dueCount, userEmail, displayName, onClose }: SidebarProps) {
    const pathname = usePathname()

    return (
        <nav
            className="flex h-full w-64 flex-col bg-card border-r border-border"
            aria-label="Primary navigation"
        >
            {/* Brand */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
                <Image
                    src="/logo.png"
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg flex-shrink-0"
                    aria-hidden="true"
                    priority
                />
                <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-sm leading-tight">VocabMaxx</div>
                    <div className="text-xs text-muted-foreground leading-tight">Everyday vocabulary</div>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {NAV_GROUPS.map((group) => (
                    <div key={group.label}>
                        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.label}
                        </p>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon
                                const active = pathname.startsWith(item.href)
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? 'page' : undefined}
                                            onClick={onClose}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                active
                                                    ? 'bg-accent-soft text-accent'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                            )}
                                        >
                                            <Icon size={19} aria-hidden="true" />
                                            <span className="flex-1">{item.label}</span>
                                            {item.badge === 'due' && dueCount > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-auto h-5 min-w-5 px-1.5 text-[11px] bg-accent text-accent-foreground"
                                                >
                                                    {dueCount}
                                                </Badge>
                                            )}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-3 py-3 space-y-1">
                <Link
                    href="/settings"
                    onClick={onClose}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        pathname.startsWith('/settings')
                            ? 'bg-accent-soft text-accent'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                >
                    <Sliders size={19} aria-hidden="true" />
                    <span>Settings</span>
                </Link>
                <UserMenu email={userEmail} displayName={displayName} />
            </div>
        </nav>
    )
}
