import { NextResponse } from 'next/server'
import { getUserForApi } from '@/lib/auth/api'
import * as srsService from '@/lib/services/srs.service'

export async function GET() {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    const cards = await srsService.listDue(user.id)
    return NextResponse.json({ data: { cards } }, { status: 200 })
}
