import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserForApi } from '@/lib/auth/api'
import * as wordService from '@/lib/services/word.service'

const idSchema = z.string().uuid()

const patchSchema = z
    .object({
        definition: z.string().trim().min(1).optional(),
        examples: z.array(z.string().trim().min(1)).min(1).max(3).optional(),
    })
    .refine((b) => b.definition !== undefined || b.examples !== undefined, {
        message: 'at least one of definition or examples is required',
    })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    const { id } = await params
    const parsedId = idSchema.safeParse(id)
    if (!parsedId.success) {
        return NextResponse.json({ error: { kind: 'invalid_id' } }, { status: 400 })
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    const parsedBody = patchSchema.safeParse(body)
    if (!parsedBody.success) {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    const result = await wordService.update(parsedId.data, user.id, parsedBody.data)
    if (!result.ok) {
        const status = result.error.kind === 'word_not_found' ? 404 : 400
        return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ data: { word: result.value } }, { status: 200 })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    const { id } = await params
    const parsed = idSchema.safeParse(id)
    if (!parsed.success) {
        return NextResponse.json({ error: { kind: 'invalid_id' } }, { status: 400 })
    }

    const deleted = await wordService.remove(parsed.data, user.id)
    if (!deleted) {
        return NextResponse.json({ error: { kind: 'word_not_found' } }, { status: 404 })
    }

    return NextResponse.json({ data: { id: parsed.data } }, { status: 200 })
}
