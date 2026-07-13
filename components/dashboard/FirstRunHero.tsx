'use client'

import { Plus, BookOpen, Layers, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuickCapture } from '@/components/capture/QuickCaptureProvider'

const STEPS = [
    {
        icon: BookOpen,
        title: 'Capture',
        body: 'Type any word you meet in the wild — definition, examples, and pronunciation are fetched for you.',
    },
    {
        icon: Layers,
        title: 'Review',
        body: 'Short daily flashcard sessions, scheduled right before you would forget (SM-2 spaced repetition).',
    },
    {
        icon: Target,
        title: 'Use it',
        body: 'Sidequests challenge you to work your words into real conversations and messages.',
    },
]

export function FirstRunHero({ displayName }: { displayName?: string | null }) {
    const { openQuickCapture } = useQuickCapture()

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-accent/25 bg-accent-soft/40 p-8 sm:p-10 text-center">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                    Welcome{displayName ? `, ${displayName}` : ''} — let&rsquo;s capture your first word
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                    Think of a word you looked up recently and almost remembered. That one.
                </p>
                <Button variant="accent" size="lg" onClick={openQuickCapture} className="mt-6 gap-2 h-12 px-6">
                    <Plus size={18} aria-hidden="true" />
                    Capture your first word
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                    Or press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd> anywhere
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {STEPS.map((step) => {
                    const Icon = step.icon
                    return (
                        <div key={step.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                                <Icon size={19} aria-hidden="true" />
                            </div>
                            <h3 className="mt-3 font-display font-semibold">{step.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
