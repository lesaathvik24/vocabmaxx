import { NextResponse } from 'next/server'
import { gradeSchema } from '@/lib/validation/review.schema'
import { getUserForApi } from '@/lib/auth/api'
import * as srsService from '@/lib/services/srs.service'

export async function POST(req: Request) {
    const user = await getUserForApi()
    if (!user) return NextResponse.json({ error: { kind: 'unauthorized' } }, { status: 401 })

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: { kind: 'invalid_body' } }, { status: 400 })
    }

    const parsed = gradeSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: { kind: 'invalid_grade' } }, { status: 400 })
    }

    const result = await srsService.recordReview(user.id, parsed.data.wordId, parsed.data.grade)
    if (!result.ok) {
        if (result.error.kind === 'word_not_found') {
            return NextResponse.json({ error: result.error }, { status: 404 })
        }
        return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(
        {
            data: {
                nextDue: result.value.dueDate.toISOString(),
                newState: result.value.state,
            },
        },
        { status: 200 },
    )
}
