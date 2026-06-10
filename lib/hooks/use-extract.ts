'use client'

import { useMutation } from '@tanstack/react-query'

interface ExtractResponse {
    data?: { candidates: string[] }
    error?: { kind: string; message?: string }
}

async function extractCandidates(text: string): Promise<string[]> {
    const res = await fetch('/api/words/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'extract', text }),
    })
    const body = (await res.json()) as ExtractResponse
    if (body.error) throw new Error(body.error.message ?? body.error.kind)
    return body.data?.candidates ?? []
}

export function useExtract() {
    return useMutation({
        mutationFn: extractCandidates,
    })
}
