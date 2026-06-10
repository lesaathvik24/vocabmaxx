import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserForApi } from '@/lib/auth/api'
import * as wordService from '@/lib/services/word.service'

const idSchema = z.string().uuid()

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
