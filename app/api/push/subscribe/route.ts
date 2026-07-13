import { NextResponse } from 'next/server'
import { getUserForApi } from '@/lib/auth/api'
import { pushSubscribeSchema, pushUnsubscribeSchema } from '@/lib/validation/push.schema'
import * as pushQ from '@/lib/db/queries/push-subscriptions'
import { take } from '@/lib/utils/rate-limit'

async function parseBody(req: Request): Promise<unknown | null> {
    try {
        return await req.json()
    } catch {
        return null
    }
}

export async function POST(req: Request) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    if (!take(`push-subscribe:${user.id}`, { capacity: 10, refillPerSec: 0.2 })) {
        return NextResponse.json({ error: { kind: 'rate_limited' } }, { status: 429 })
    }

    const body = await parseBody(req)
    const parsed = pushSubscribeSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    await pushQ.upsert(user.id, {
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
    })
    return NextResponse.json({ data: { subscribed: true } }, { status: 200 })
}

export async function DELETE(req: Request) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    const body = await parseBody(req)
    const parsed = pushUnsubscribeSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    const removed = await pushQ.removeByEndpoint(user.id, parsed.data.endpoint)
    return NextResponse.json({ data: { removed } }, { status: 200 })
}
