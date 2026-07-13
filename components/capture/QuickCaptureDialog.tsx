'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { AddWordInput, type CaptureOutcome } from './AddWordInput'
import { CapturedWordCard } from './CapturedWordCard'
import { useCapture, type CapturedWord } from '@/lib/hooks/use-capture'
import { toUserMessage } from '@/lib/utils/errors'

interface QuickCaptureDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function QuickCaptureDialog({ open, onOpenChange }: QuickCaptureDialogProps) {
    const router = useRouter()
    const captureMutation = useCapture()
    const [lastCaptured, setLastCaptured] = useState<CapturedWord | null>(null)

    async function handleCapture(term: string): Promise<CaptureOutcome> {
        try {
            const result = await captureMutation.mutateAsync(term)
            if (result.kind === 'suggestion') {
                return { status: 'suggestion', suggestion: result.suggestion }
            }
            setLastCaptured(result.word)
            router.refresh()
            return { status: 'saved', word: result.word }
        } catch (err) {
            const kind = err instanceof Error ? err.message : 'unknown'
            return { status: 'error', error: toUserMessage(kind) }
        }
    }

    function handleOpenChange(next: boolean) {
        if (!next) setLastCaptured(null)
        onOpenChange(next)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display">Add a word</DialogTitle>
                    <DialogDescription>
                        Capture from anywhere — we&rsquo;ll fetch the definition automatically.
                    </DialogDescription>
                </DialogHeader>
                <AddWordInput onSubmit={handleCapture} loading={captureMutation.isPending} />
                {lastCaptured && (
                    <CapturedWordCard
                        key={lastCaptured.id}
                        word={lastCaptured}
                        onAddAnother={() => setLastCaptured(null)}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
