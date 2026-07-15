'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Loader2, Check, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { CapturedWord } from '@/lib/hooks/use-capture'

export type CaptureOutcome =
    | { status: 'saved'; word: CapturedWord }
    | { status: 'suggestion'; suggestion: string }
    | { status: 'error'; error: string }

interface AddWordInputProps {
    onSubmit: (term: string) => Promise<CaptureOutcome>
    loading: boolean
}

const RETRY_MESSAGE = 'No worries — please spell it again.'

export function AddWordInput({ onSubmit, loading }: AddWordInputProps) {
    const [value, setValue] = useState('')
    const [open, setOpen] = useState(false)
    const [typedTerm, setTypedTerm] = useState('')
    const [suggestion, setSuggestion] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    function refocus() {
        // Defer until after the dialog has unmounted so focus actually lands.
        setTimeout(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
        }, 0)
    }

    async function submitTerm(term: string, fromSuggestion: boolean) {
        const outcome = await onSubmit(term)

        if (outcome.status === 'saved') {
            setValue('')
            setOpen(false)
            inputRef.current?.focus()
            return
        }

        if (outcome.status === 'suggestion') {
            // Accepting a suggestion that still isn't a word would loop — bail out instead.
            if (fromSuggestion) {
                setOpen(false)
                toast.error(`Still couldn't find that — please spell it again.`)
                return
            }
            setTypedTerm(term)
            setSuggestion(outcome.suggestion)
            setOpen(true)
            return
        }

        setOpen(false)
        toast.error(outcome.error)
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        const term = value.trim()
        if (!term) return
        await submitTerm(term, false)
    }

    function dismissSuggestion() {
        setOpen(false)
        toast.info(RETRY_MESSAGE)
        refocus()
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex items-center gap-2 rounded-[18px] border-2 border-accent bg-card px-4 h-16 shadow-[0_12px_30px_-14px_rgba(47,91,234,.4)] focus-within:shadow-[0_16px_36px_-14px_rgba(47,91,234,.5)] transition-shadow">
                    <Search size={22} className="flex-shrink-0 text-faint" aria-hidden="true" />
                    <Input
                        id="capture-input"
                        ref={inputRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Type a word, we'll do the rest"
                        aria-label="Word to capture"
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={loading}
                        aria-describedby="capture-hint"
                        className="flex-1 h-full border-0 bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0 dark:bg-transparent"
                    />
                    <Button
                        type="submit"
                        disabled={loading || !value.trim()}
                        variant="accent"
                        className="h-10 px-5 gap-2 flex-shrink-0"
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
                <p id="capture-hint" className="text-center text-[12.5px] text-faint">
                    Definition fetched automatically · common words use the dictionary, rare words use AI
                </p>
            </form>

            <Dialog
                open={open}
                onOpenChange={(next) => {
                    // Fires only on user-initiated dismiss (Esc / overlay); programmatic
                    // closes on save/accept don't trigger this.
                    if (!next) dismissSuggestion()
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display">Did you mean…?</DialogTitle>
                        <DialogDescription>
                            We couldn&rsquo;t find{' '}
                            <span className="font-medium text-foreground">&ldquo;{typedTerm}&rdquo;</span>. Did you mean:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center justify-center rounded-xl border border-border bg-muted/40 py-5">
                        <span className="font-display text-2xl font-semibold tracking-tight text-accent">
                            {suggestion}
                        </span>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={dismissSuggestion}
                            disabled={loading}
                            className="gap-2"
                        >
                            <X size={16} aria-hidden="true" />
                            No, retype
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void submitTerm(suggestion, true)}
                            disabled={loading}
                            variant="accent"
                            className="gap-2"
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                            ) : (
                                <Check size={16} aria-hidden="true" />
                            )}
                            Yes, add &ldquo;{suggestion}&rdquo;
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
