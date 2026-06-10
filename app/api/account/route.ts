import { NextResponse } from 'next/server'
import { getUserForApi } from '@/lib/auth/api'
import { createClient } from '@/lib/auth/server'
import * as accountService from '@/lib/services/account.service'

export const dynamic = 'force-dynamic'

export async function DELETE() {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    const result = await accountService.deleteAccount(user.id)
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Best-effort: clear the now-orphaned session cookies on this response.
    try {
        const supabase = await createClient()
        await supabase.auth.signOut()
    } catch {
        // user is already gone; cookie cleanup is non-critical
    }

    return NextResponse.json({ data: { deleted: true } }, { status: 200 })
}
