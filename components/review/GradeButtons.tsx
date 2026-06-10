'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

type Grade = 0 | 3 | 4 | 5

interface GradeButtonsProps {
    onGrade: (g: Grade) => void
    disabled?: boolean
}

interface GradeDef {
    grade: Grade
    label: string
    key: string
    colorClass: string
}

const GRADES: GradeDef[] = [
    { grade: 0, label: 'Again', key: '1', colorClass: 'border-destructive/50 text-destructive hover:bg-destructive/10' },
    { grade: 3, label: 'Hard', key: '2', colorClass: 'border-warning/50 text-warning hover:bg-warning/10' },
    { grade: 4, label: 'Good', key: '3', colorClass: 'border-accent/50 text-accent hover:bg-accent/10' },
    { grade: 5, label: 'Easy', key: '4', colorClass: 'border-success/50 text-success hover:bg-success/10' },
]

export function GradeButtons({ onGrade, disabled = false }: GradeButtonsProps) {
    useEffect(() => {
        if (disabled) return
        function onKey(e: KeyboardEvent) {
            const found = GRADES.find((g) => g.key === e.key)
            if (found) {
                e.preventDefault()
                onGrade(found.grade)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [disabled, onGrade])

    return (
        <div
            className="flex gap-2 sm:gap-3 w-full max-w-[420px] md:max-w-[560px] mx-auto"
            aria-hidden={disabled}
        >
            {GRADES.map((g) => (
                <button
                    key={g.grade}
                    disabled={disabled}
                    onClick={() => onGrade(g.grade)}
                    className={cn(
                        'flex flex-1 flex-col items-center gap-1 rounded-xl border bg-card px-2 py-3 min-h-[56px]',
                        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'disabled:opacity-40 disabled:pointer-events-none',
                        g.colorClass,
                    )}
                    aria-label={`Grade: ${g.label} (key ${g.key})`}
                >
                    <span className="font-mono text-[11px] opacity-60">{g.key}</span>
                    <span className="text-sm font-semibold">{g.label}</span>
                </button>
            ))}
        </div>
    )
}
