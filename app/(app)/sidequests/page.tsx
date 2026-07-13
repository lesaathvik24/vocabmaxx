import { requireUser } from '@/lib/auth/server'
import { getBoard } from '@/lib/services/sidequest.service'
import { MIN_WORDS_FOR_QUEST, type Sidequest } from '@/lib/domain/sidequest'
import { SidequestBoard } from '@/components/sidequests/SidequestBoard'
import type { SidequestDTO } from '@/components/sidequests/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/empty-state'
import { Target, CloudOff } from 'lucide-react'

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
            <PageHeader
                eyebrow="Use it or lose it"
                title="Sidequests"
                description="Work one of your words into real life — out loud or in a message — then prove it."
            />

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
                <div className="rounded-2xl border border-dashed border-border bg-card">
                    <EmptyState
                        icon={<Target size={28} aria-hidden="true" />}
                        title="Capture a few words first"
                        body={`Sidequests pull from your own collection. Add at least ${MIN_WORDS_FOR_QUEST} words to start getting missions.`}
                    />
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card">
                    <EmptyState
                        icon={<CloudOff size={28} aria-hidden="true" />}
                        title="Couldn’t load a sidequest"
                        body="The mission generator is unavailable right now. Please try again in a moment."
                    />
                </div>
            )}
        </div>
    )
}
