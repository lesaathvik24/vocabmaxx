import { NextResponse } from 'next/server'
import { submitSidequestSchema } from '@/lib/validation/sidequest.schema'
import { getUserForApi } from '@/lib/auth/api'
import * as sidequestService from '@/lib/services/sidequest.service'
import { take } from '@/lib/utils/rate-limit'
import { toUserMessage } from '@/lib/utils/errors'

export async function POST(req: Request) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    // Judging hits a paid LLM call — throttle per user.
    if (!take(`sidequest:submit:${user.id}`, { capacity: 20, refillPerSec: 0.5 })) {
        return NextResponse.json(
            { error: { kind: 'rate_limited', message: toUserMessage('rate_limited') } },
            { status: 429 },
        )
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    const parsed = submitSidequestSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: { kind: 'invalid_input' } }, { status: 400 })
    }

    const result = await sidequestService.submit(user.id, parsed.data.questId, parsed.data.sentence)
    if (!result.ok) {
        const e = result.error
        if (e.kind === 'quest_not_found') return NextResponse.json({ error: e }, { status: 404 })
        if (e.kind === 'already_completed') return NextResponse.json({ error: e }, { status: 409 })
        if (e.kind === 'malformed_llm_response') return NextResponse.json({ error: { kind: e.kind } }, { status: 502 })
        if (e.kind === 'network_failure') return NextResponse.json({ error: { kind: e.kind } }, { status: 503 })
        if (e.kind === 'rate_limited') return NextResponse.json({ error: e }, { status: 503 })
        if (e.kind === 'no_fallback_available') return NextResponse.json({ error: e }, { status: 503 })
        return NextResponse.json({ error: e }, { status: 500 })
    }

    return NextResponse.json({ data: result.value }, { status: 200 })
}
