'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface WordEditorProps {
    wordId: string
    term: string
    definition: string
    examples: string[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function WordEditor({
    wordId,
    term,
    definition,
    examples,
    open,
    onOpenChange,
}: WordEditorProps) {
    const router = useRouter()
    const [def, setDef] = useState(definition)
    const [exs, setExs] = useState<string[]>(examples.length ? examples : [''])
    const [saving, setSaving] = useState(false)

    function updateExample(i: number, value: string) {
        setExs((cur) => cur.map((e, idx) => (idx === i ? value : e)))
    }
    function addExample() {
        setExs((cur) => (cur.length >= 3 ? cur : [...cur, '']))
    }
    function removeExample(i: number) {
        setExs((cur) => (cur.length <= 1 ? cur : cur.filter((_, idx) => idx !== i)))
    }

    async function save() {
        const cleanedDef = def.trim()
        const cleanedExs = exs.map((e) => e.trim()).filter((e) => e.length > 0)
        if (cleanedDef.length === 0) {
            toast.error('Definition cannot be empty.')
            return
        }
        if (cleanedExs.length < 1 || cleanedExs.length > 3) {
            toast.error('Add between 1 and 3 example sentences.')
            return
        }

        setSaving(true)
        try {
            const res = await fetch(`/api/words/${wordId}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ definition: cleanedDef, examples: cleanedExs }),
            })
            if (!res.ok) {
                toast.error(`Couldn't save changes to "${term}". Try again.`)
                return
            }
            toast.success(`Updated "${term}".`)
            onOpenChange(false)
            router.refresh()
        } catch {
            toast.error('Network error. Changes were not saved.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit “{term}”</DialogTitle>
                    <DialogDescription>
                        Update the definition or example sentences. The term itself can&apos;t be changed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="word-def" className="text-sm font-medium">
                            Definition
                        </label>
                        <textarea
                            id="word-def"
                            value={def}
                            onChange={(e) => setDef(e.target.value)}
                            rows={3}
                            className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-sm font-medium">Examples ({exs.length}/3)</span>
                        <div className="space-y-2">
                            {exs.map((ex, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        value={ex}
                                        onChange={(e) => updateExample(i, e.target.value)}
                                        placeholder={`Example ${i + 1}`}
                                        className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                    {exs.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Remove example ${i + 1}`}
                                            onClick={() => removeExample(i)}
                                            className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <X size={15} aria-hidden="true" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {exs.length < 3 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={addExample}
                                className="gap-1.5 text-muted-foreground"
                            >
                                <Plus size={15} aria-hidden="true" /> Add example
                            </Button>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={save} disabled={saving} className="gap-2">
                        {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
