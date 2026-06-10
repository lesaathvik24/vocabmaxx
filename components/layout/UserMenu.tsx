'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
    email: string
}

function initials(email: string): string {
    const local = email.split('@')[0] ?? ''
    const parts = local.split(/[._-]/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return local.slice(0, 2).toUpperCase() || 'U'
}

export function UserMenu({ email }: UserMenuProps) {
    const router = useRouter()

    async function handleSignOut() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/auth/sign-in')
        router.refresh()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
                aria-label="Account menu"
            >
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent text-xs font-semibold flex-shrink-0"
                    aria-hidden="true"
                >
                    {initials(email)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-xs font-semibold leading-tight">{email}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">Free · beta</div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
                <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut size={16} aria-hidden="true" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
