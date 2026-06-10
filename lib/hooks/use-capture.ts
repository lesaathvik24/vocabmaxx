'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CaptureResponse {
    data?: { word: { id: string; term: string; definition: string; source: string; addedAt: string } }
    error?: { kind: string }
}

async function captureWord(term: string): Promise<NonNullable<CaptureResponse['data']>> {
    const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ term }),
    })
    const body = (await res.json()) as CaptureResponse
    if (!res.ok || body.error || !body.data) {
        throw new Error(body.error?.kind ?? 'capture_failed')
    }
    return body.data
}

export function useCapture() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: captureWord,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['recent-words'] })
            void queryClient.invalidateQueries({ queryKey: ['stats'] })
        },
    })
}
