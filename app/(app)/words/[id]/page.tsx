import { notFound } from 'next/navigation'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/server'
import * as wordService from '@/lib/services/word.service'
import { WordDetail } from '@/components/words/WordDetail'

export const metadata = { title: 'Word' }
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

export default async function WordDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const user = await requireUser()
    const { id } = await params

    const parsed = idSchema.safeParse(id)
    if (!parsed.success) notFound()

    const detail = await wordService.getDetail(parsed.data, user.id)
    if (!detail) notFound()

    return (
        <WordDetail
            id={detail.word.id}
            term={detail.word.term}
            definition={detail.word.definition}
            examples={detail.word.examples}
            source={detail.word.source}
            phonetic={detail.word.phonetic}
            audioUrl={detail.word.audioUrl}
            senses={detail.word.senses}
            addedAt={detail.word.addedAt.toISOString()}
            status={detail.status}
            due={detail.due}
            srs={
                detail.srs
                    ? {
                          easeFactor: detail.srs.easeFactor,
                          intervalDays: detail.srs.intervalDays,
                          repetitions: detail.srs.repetitions,
                          dueDate: detail.srs.dueDate.toISOString(),
                          lastReviewedAt: detail.srs.lastReviewedAt?.toISOString() ?? null,
                      }
                    : null
            }
            history={detail.history.map((h) => ({
                grade: h.grade,
                reviewedAt: h.reviewedAt.toISOString(),
            }))}
        />
    )
}
