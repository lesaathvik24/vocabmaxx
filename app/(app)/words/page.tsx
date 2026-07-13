import { requireUser } from '@/lib/auth/server'
import * as wordService from '@/lib/services/word.service'
import { PageHeader } from '@/components/layout/PageHeader'
import { WordsList, type WordRow } from '@/components/words/WordsList'

export const metadata = { title: 'Words' }
export const dynamic = 'force-dynamic'

export default async function WordsPage() {
    const user = await requireUser()
    const words = await wordService.listWithStatus(user.id)

    const rows: WordRow[] = words.map((w) => ({
        id: w.id,
        term: w.term,
        definition: w.definition,
        source: w.source,
        phonetic: w.phonetic,
        audioUrl: w.audioUrl,
        addedAt: w.addedAt.toISOString(),
        status: w.status,
        due: w.due,
    }))

    return (
        <div className="space-y-6">
            <PageHeader
                title="Your words"
                description={
                    rows.length === 0
                        ? 'Capture your first word to start building your library.'
                        : `${rows.length} ${rows.length === 1 ? 'word' : 'words'} captured.`
                }
            />
            <WordsList words={rows} />
        </div>
    )
}
