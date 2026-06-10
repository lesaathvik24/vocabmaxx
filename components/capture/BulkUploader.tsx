'use client'

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface BulkUploaderProps {
    onUpload: (terms: string[]) => Promise<{ added: number; skipped: number; failed: number }>
}

interface ProgressState {
    open: boolean
    total: number
    done: boolean
    result: { added: number; skipped: number; failed: number } | null
}

function parseTerms(raw: string): string[] {
    return raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
}

export function BulkUploader({ onUpload }: BulkUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)
    const [progress, setProgress] = useState<ProgressState>({
        open: false,
        total: 0,
        done: false,
        result: null,
    })

    async function processFile(file: File) {
        if (!file.name.endsWith('.txt')) {
            toast.error('Only .txt files are supported.')
            return
        }
        const raw = await file.text()
        const terms = parseTerms(raw)
        if (terms.length === 0) {
            toast.info('No terms found in the file.')
            return
        }
        setProgress({ open: true, total: terms.length, done: false, result: null })
        try {
            const result = await onUpload(terms)
            setProgress((p) => ({ ...p, done: true, result }))
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed')
            setProgress((p) => ({ ...p, open: false }))
        }
    }

    function handleDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) void processFile(file)
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) void processFile(file)
        e.target.value = ''
    }

    function closeModal() {
        setProgress({ open: false, total: 0, done: false, result: null })
    }

    return (
        <>
            {/* Drop zone */}
            <div
                role="button"
                tabIndex={0}
                aria-label="Upload .txt file — click or drag and drop"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        inputRef.current?.click()
                    }
                }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed',
                    'min-h-[160px] p-8 cursor-pointer transition-colors select-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    dragging
                        ? 'border-accent bg-accent-soft'
                        : 'border-border bg-card hover:border-accent/50 hover:bg-muted/40',
                )}
            >
                <Upload
                    size={32}
                    className={cn('transition-colors', dragging ? 'text-accent' : 'text-muted-foreground')}
                    aria-hidden="true"
                />
                <div className="text-center">
                    <p className="font-medium text-sm">Drop a .txt file here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to choose</p>
                </div>
                <p className="text-xs text-muted-foreground">
                    One word per line. Duplicates are skipped automatically.
                </p>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
            />

            {/* Progress modal */}
            <Dialog open={progress.open} onOpenChange={(open) => { if (!open) closeModal() }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {progress.done ? 'Import complete' : 'Importing words…'}
                        </DialogTitle>
                        <DialogDescription>
                            {progress.done
                                ? 'Your words have been processed.'
                                : `Processing ${progress.total} terms from your file.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {!progress.done ? (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Loader2 size={18} className="animate-spin text-accent flex-shrink-0" aria-hidden="true" />
                                <span>Capturing {progress.total} terms…</span>
                            </div>
                        ) : progress.result ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-success">
                                    <CheckCircle2 size={20} aria-hidden="true" />
                                    <span className="font-semibold text-sm">Done</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {(
                                        [
                                            { label: 'Added', value: progress.result.added, color: 'text-success' },
                                            { label: 'Skipped', value: progress.result.skipped, color: 'text-muted-foreground' },
                                            { label: 'Failed', value: progress.result.failed, color: 'text-destructive' },
                                        ] as const
                                    ).map(({ label, value, color }) => (
                                        <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                                            <p className={cn('font-display font-semibold text-xl', color)}>{value}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={closeModal} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 min-h-[44px]">
                                    Done
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* File type hint */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText size={13} aria-hidden="true" />
                <span>Accepted format: plain .txt, one word/phrase per line.</span>
            </div>
        </>
    )
}
