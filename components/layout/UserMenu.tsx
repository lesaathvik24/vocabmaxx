'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/client'

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
    const [signingOut, setSigningOut] = useState(false)

    async function handleSignOut() {
        if (signingOut) return
        setSigningOut(true)
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/auth/sign-in')
        router.refresh()
    }

    return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-2">
            <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent text-xs font-semibold flex-shrink-0"
                aria-hidden="true"
            >
                {initials(email)}
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold leading-tight" title={email}>
                    {email}
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight">Free · beta</div>
            </div>
            <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 transition-colors"
            >
                {signingOut ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                    <LogOut size={16} aria-hidden="true" />
                )}
            </button>
        </div>
    )
}
