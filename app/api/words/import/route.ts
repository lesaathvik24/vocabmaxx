import { NextResponse } from 'next/server'
import { getUserForApi } from '@/lib/auth/api'
import { importRequestSchema } from '@/lib/validation/import.schema'
import * as importService from '@/lib/services/import.service'
import { toUserMessage } from '@/lib/utils/errors'
import { take } from '@/lib/utils/rate-limit'

export async function POST(req: Request) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    if (!take(`import:${user.id}`, { capacity: 10, refillPerSec: 1 })) {
        return NextResponse.json({ error: { kind: 'rate_limited', message: toUserMessage('rate_limited') } }, { status: 429 })
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    const parsed = importRequestSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: { kind: 'invalid_body', details: parsed.error.flatten() } }, { status: 400 })
    }

    if (parsed.data.mode === 'extract') {
        const result = await importService.extract(parsed.data.text)
        if (!result.ok) {
            const e = result.error
            if (e.kind === 'rate_limited') return NextResponse.json({ error: { kind: e.kind, message: toUserMessage(e.kind) } }, { status: 503 })
            if (e.kind === 'invalid_input') return NextResponse.json({ error: { kind: e.kind, message: e.message } }, { status: 400 })
            if (e.kind === 'malformed_llm_response') return NextResponse.json({ error: { kind: e.kind, message: toUserMessage(e.kind) } }, { status: 502 })
            return NextResponse.json({ error: { kind: e.kind, message: toUserMessage(e.kind) } }, { status: 503 })
        }
        return NextResponse.json({ data: { candidates: result.value } })
    }

    // mode === 'save'
    const result = await importService.saveBulk(user.id, parsed.data.terms)
    if (!result.ok) {
        const e = result.error
        if (e.kind === 'invalid_input') return NextResponse.json({ error: { kind: e.kind, message: e.message } }, { status: 400 })
        return NextResponse.json({ error: { kind: e.kind, message: toUserMessage(e.kind) } }, { status: 500 })
    }
    return NextResponse.json({ data: { added: result.value.added, skipped: result.value.skipped, failed: result.value.failed } })
}
