import { NextResponse } from 'next/server'
import { getUserForApi } from '@/lib/auth/api'
import * as exportService from '@/lib/services/export.service'

export const dynamic = 'force-dynamic'

function fileStamp(now = new Date()): string {
    return now.toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function GET(req: Request) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    const format = new URL(req.url).searchParams.get('format') ?? 'json'
    const stamp = fileStamp()

    if (format === 'json') {
        const body = await exportService.asJSON(user.id)
        return new NextResponse(body, {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="vocabmaxx-${stamp}.json"`,
            },
        })
    }

    if (format === 'csv') {
        const body = await exportService.asCSV(user.id)
        return new NextResponse(body, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="vocabmaxx-${stamp}.csv"`,
            },
        })
    }

    if (format === 'anki') {
        // Task 8.2b deferred — see webusage.md "Phase 8 / 8.2b".
        return NextResponse.json({ error: { kind: 'not_implemented' } }, { status: 501 })
    }

    return NextResponse.json({ error: { kind: 'invalid_format' } }, { status: 400 })
}
