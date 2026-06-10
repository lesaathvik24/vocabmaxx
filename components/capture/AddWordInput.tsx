'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddWordInputProps {
    onSubmit: (term: string) => Promise<{ ok: boolean; error?: string }>
    loading: boolean
}

export function AddWordInput({ onSubmit, loading }: AddWordInputProps) {
    const [value, setValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        const term = value.trim()
        if (!term) return

        const result = await onSubmit(term)
        if (result.ok) {
            toast.success(`Captured: ${term}`)
            setValue('')
            inputRef.current?.focus()
        } else {
            toast.error(result.error ?? 'Failed to capture word')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="capture-input">Word or phrase</Label>
                <div className="flex gap-2">
                    <Input
                        id="capture-input"
                        ref={inputRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="e.g. ubiquitous, ephemeral…"
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={loading}
                        className="flex-1 h-11 text-base"
                        aria-describedby="capture-hint"
                    />
                    <Button
                        type="submit"
                        disabled={loading || !value.trim()}
                        className="h-11 px-5 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 flex-shrink-0 min-w-[100px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                <span>Saving…</span>
                            </>
                        ) : (
                            'Capture'
                        )}
                    </Button>
                </div>
                <p id="capture-hint" className="text-xs text-muted-foreground">
                    Press Enter to capture. Common words use the dictionary, rare words use AI.
                </p>
            </div>
        </form>
    )
}
