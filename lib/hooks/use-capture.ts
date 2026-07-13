'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface CapturedWord {
    id: string
    term: string
    definition: string
    examples: string[]
    source: string
    phonetic: string | null
    audioUrl: string | null
    addedAt: string
}

export type CaptureResult =
    | { kind: 'saved'; word: CapturedWord }
    | { kind: 'suggestion'; suggestion: string }

interface CaptureResponse {
    data?: { word?: CapturedWord; suggestion?: string }
    error?: { kind: string }
}

async function captureWord(term: string): Promise<CaptureResult> {
    const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ term }),
    })
    const body = (await res.json()) as CaptureResponse
    if (res.ok && body.data?.word) return { kind: 'saved', word: body.data.word }
    if (res.ok && body.data?.suggestion) return { kind: 'suggestion', suggestion: body.data.suggestion }
    throw new Error(body.error?.kind ?? 'capture_failed')
}

export function useCapture() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: captureWord,
        onSuccess: (result) => {
            if (result.kind !== 'saved') return
            void queryClient.invalidateQueries({ queryKey: ['recent-words'] })
            void queryClient.invalidateQueries({ queryKey: ['stats'] })
        },
    })
}
