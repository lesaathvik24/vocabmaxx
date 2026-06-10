import { NextResponse } from 'next/server'
import { runDailyDigest } from '@/lib/services/digest.service'

export const dynamic = 'force-dynamic'
// Email + DB fan-out can exceed the default 10s on a busy hour.
export const maxDuration = 60

/** Constant-time-ish bearer check against CRON_SECRET. */
function authorized(req: Request): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) return false
    return req.headers.get('authorization') === `Bearer ${secret}`
}

async function handle(req: Request) {
    if (!authorized(req)) {
        return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })
    }
    const result = await runDailyDigest(new Date())
    return NextResponse.json({ data: result }, { status: 200 })
}

// Vercel Cron triggers a GET; the documented manual fire (RUNBOOK §7.2) uses POST.
export const GET = handle
export const POST = handle
