import { requireUser } from '@/lib/auth/server'
import * as wordService from '@/lib/services/word.service'
import { WordsList, type WordRow } from '@/components/words/WordsList'

export const metadata = { title: 'Words' }
export const dynamic = 'force-dynamic'

export default async function WordsPage() {
    const user = await requireUser()
    const words = await wordService.listForUser(user.id)

    const rows: WordRow[] = words.map((w) => ({
        id: w.id,
        term: w.term,
        definition: w.definition,
        source: w.source,
        addedAt: w.addedAt.toISOString(),
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display font-semibold text-2xl sm:text-3xl">Your words</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {rows.length === 0
                        ? 'Capture your first word to start building your library.'
                        : `${rows.length} ${rows.length === 1 ? 'word' : 'words'} captured. Search or delete below.`}
                </p>
            </div>
            <WordsList words={rows} />
        </div>
    )
}
