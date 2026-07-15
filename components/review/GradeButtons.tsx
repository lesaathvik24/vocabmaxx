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
    hint: string
    key: string
    colorClass: string
    hintClass: string
}

const GRADES: GradeDef[] = [
    {
        grade: 0,
        label: 'Again',
        hint: '< 1 min',
        key: '1',
        colorClass: 'bg-card border-[#f0c8c4] text-destructive hover:bg-destructive/5',
        hintClass: 'opacity-75',
    },
    {
        grade: 3,
        label: 'Hard',
        hint: '6 min',
        key: '2',
        colorClass: 'bg-card border-border text-muted-foreground hover:bg-muted/50',
        hintClass: 'opacity-75',
    },
    {
        grade: 4,
        label: 'Good',
        hint: '1 day',
        key: '3',
        colorClass:
            'bg-accent border-accent text-accent-foreground shadow-[0_10px_22px_-10px_rgba(47,91,234,.7)] hover:bg-accent/90',
        hintClass: 'opacity-85',
    },
    {
        grade: 5,
        label: 'Easy',
        hint: '4 days',
        key: '4',
        colorClass: 'bg-card border-[#b9e6d0] text-success hover:bg-success/5',
        hintClass: 'opacity-75',
    },
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
                        'flex flex-1 flex-col items-center gap-0.5 rounded-[14px] border-[1.5px] px-2 py-3 min-h-[56px]',
                        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'disabled:opacity-40 disabled:pointer-events-none',
                        g.colorClass,
                    )}
                    aria-label={`Grade: ${g.label} (key ${g.key}) — next in ${g.hint}`}
                >
                    <span className="text-sm font-semibold">{g.label}</span>
                    <span className={cn('num text-[11px] font-medium', g.hintClass)}>{g.hint}</span>
                </button>
            ))}
        </div>
    )
}
