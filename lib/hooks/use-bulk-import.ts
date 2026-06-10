'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

interface BulkImportResponse {
    data?: { added: number; skipped: number; failed: number }
    error?: { kind: string; message?: string }
}

interface BulkImportResult {
    added: number
    skipped: number
    failed: number
}

async function bulkImport(terms: string[]): Promise<BulkImportResult> {
    const res = await fetch('/api/words/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'save', terms }),
    })
    const body = (await res.json()) as BulkImportResponse
    if (body.error) throw new Error(body.error.message ?? body.error.kind)
    return body.data ?? { added: 0, skipped: 0, failed: 0 }
}

export function useBulkImport() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: bulkImport,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['recent-words'] })
            void queryClient.invalidateQueries({ queryKey: ['stats'] })
        },
    })
}
