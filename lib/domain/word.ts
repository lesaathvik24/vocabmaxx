import type { SRSState } from './srs'

export interface Word {
    id: string
    userId: string
    term: string
    definition: string
    examples: string[]
    source: 'dictionary' | 'llm'
    addedAt: Date
}

export interface WordWithSRS extends Word {
    srs: SRSState & { dueDate: Date; lastReviewedAt: Date | null }
}
