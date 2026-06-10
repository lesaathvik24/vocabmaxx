import { NextResponse } from 'next/server'
import { captureSchema } from '@/lib/validation/capture.schema'
import { getUserForApi } from '@/lib/auth/api'
import * as definitionService from '@/lib/services/definition.service'
import * as wordService from '@/lib/services/word.service'

export async function POST(req: Request) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    const parsed = captureSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: { kind: 'invalid_term' } }, { status: 400 })
    }

    const defResult = await definitionService.fetchDefinition(parsed.data.term)
    if (!defResult.ok) {
        const e = defResult.error
        if (e.kind === 'invalid_term') return NextResponse.json({ error: e }, { status: 400 })
        if (e.kind === 'not_found') return NextResponse.json({ error: e }, { status: 404 })
        if (e.kind === 'not_a_word') return NextResponse.json({ error: e }, { status: 422 })
        if (e.kind === 'no_fallback_available') return NextResponse.json({ error: e }, { status: 400 })
        if (e.kind === 'malformed_llm_response') return NextResponse.json({ error: { kind: e.kind } }, { status: 502 })
        if (e.kind === 'network_failure') return NextResponse.json({ error: { kind: e.kind } }, { status: 503 })
        if (e.kind === 'rate_limited') return NextResponse.json({ error: e }, { status: 503 })
        return NextResponse.json({ error: e }, { status: 500 })
    }

    const saveResult = await wordService.save({
        userId: user.id,
        term: defResult.value.term,
        definition: defResult.value.def.definition,
        examples: defResult.value.def.examples,
        source: defResult.value.def.source,
    })
    if (!saveResult.ok) {
        if (saveResult.error.kind === 'duplicate_term') {
            return NextResponse.json({ error: saveResult.error }, { status: 409 })
        }
        return NextResponse.json({ error: saveResult.error }, { status: 500 })
    }

    return NextResponse.json({ data: { word: saveResult.value } }, { status: 200 })
}
