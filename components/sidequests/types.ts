import type { SidequestChannel, SidequestStats } from '@/lib/domain/sidequest'

export interface SidequestDTO {
    id: string
    term: string
    definition: string
    scenario: string
    channel: SidequestChannel
    expiresAt: string
}

export interface SidequestBoardData {
    active: SidequestDTO | null
    backlog: SidequestDTO[]
    stats: SidequestStats
    justExpired: number
}

export interface SubmitResult {
    correct: boolean
    reason: string
    xpAwarded: number
}
