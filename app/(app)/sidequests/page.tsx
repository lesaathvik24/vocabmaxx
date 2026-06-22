import { requireUser } from '@/lib/auth/server'
import { getBoard } from '@/lib/services/sidequest.service'
import { MIN_WORDS_FOR_QUEST, type Sidequest } from '@/lib/domain/sidequest'
import { SidequestBoard } from '@/components/sidequests/SidequestBoard'
import type { SidequestDTO } from '@/components/sidequests/types'
import { Target } from 'lucide-react'

export const metadata = { title: 'Sidequests' }

function toDTO(q: Sidequest): SidequestDTO {
    return {
        id: q.id,
        term: q.term,
        definition: q.definition,
        scenario: q.scenario,
        channel: q.channel,
        expiresAt: q.expiresAt.toISOString(),
    }
}

export default async function SidequestsPage() {
    const user = await requireUser()
    const result = await getBoard(user.id)

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Use it or lose it
                </p>
                <h1 className="font-display font-semibold text-2xl sm:text-3xl mt-1">Sidequests</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Work one of your words into real life — out loud or in a message — then prove it.
                </p>
            </div>

            {result.ok ? (
                <SidequestBoard
                    data={{
                        active: result.value.active ? toDTO(result.value.active) : null,
                        backlog: result.value.backlog.map(toDTO),
                        stats: result.value.stats,
                        justExpired: result.value.justExpired,
                    }}
                />
            ) : result.error.kind === 'no_words' ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                    <Target size={32} className="mx-auto text-muted-foreground" aria-hidden="true" />
                    <p className="mt-4 font-medium">Capture a few words first</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sidequests pull from your own collection. Add at least {MIN_WORDS_FOR_QUEST} words to
                        start getting missions.
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card p-10 text-center">
                    <p className="font-medium">Couldn’t load a sidequest</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        The mission generator is unavailable right now. Please try again in a moment.
                    </p>
                </div>
            )}
        </div>
    )
}
