import { NextResponse } from 'next/server'
import { getUserForApi } from '@/lib/auth/api'
import { preferencesPatchSchema } from '@/lib/validation/preferences.schema'
import * as preferencesService from '@/lib/services/preferences.service'

export const dynamic = 'force-dynamic'

export async function GET() {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    const prefs = await preferencesService.get(user.id)
    return NextResponse.json({ data: { preferences: prefs } }, { status: 200 })
}

export async function PATCH(req: Request) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    const parsed = preferencesPatchSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    const prefs = await preferencesService.update(user.id, parsed.data)
    return NextResponse.json({ data: { preferences: prefs } }, { status: 200 })
}
