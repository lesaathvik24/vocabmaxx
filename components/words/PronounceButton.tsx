'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PronounceButtonProps {
    term: string
    audioUrl?: string | null
    size?: 'sm' | 'md'
    className?: string
}

type PlayState = 'idle' | 'loading' | 'playing'

function canSpeak(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Plays the dictionary audio when available; otherwise falls back to the
 * browser's speech synthesis. Hidden entirely when neither is possible.
 */
export function PronounceButton({ term, audioUrl, size = 'md', className }: PronounceButtonProps) {
    const [state, setState] = useState<PlayState>('idle')
    const [supported, setSupported] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        setSupported(Boolean(audioUrl) || canSpeak())
        return () => {
            audioRef.current?.pause()
            if (canSpeak()) window.speechSynthesis.cancel()
        }
    }, [audioUrl])

    function speakFallback() {
        if (!canSpeak()) {
            setState('idle')
            return
        }
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(term)
        utterance.lang = 'en-US'
        utterance.rate = 0.9
        utterance.onend = () => setState('idle')
        utterance.onerror = () => setState('idle')
        setState('playing')
        window.speechSynthesis.speak(utterance)
    }

    function play(e: React.MouseEvent) {
        e.stopPropagation()
        if (state !== 'idle') return

        if (!audioUrl) {
            speakFallback()
            return
        }

        setState('loading')
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        audio.onplaying = () => setState('playing')
        audio.onended = () => setState('idle')
        audio.onerror = () => speakFallback()
        audio.play().catch(() => speakFallback())
    }

    if (!supported) return null

    const iconSize = size === 'sm' ? 15 : 18

    return (
        <button
            type="button"
            onClick={play}
            aria-label={`Pronounce "${term}"`}
            title={`Pronounce "${term}"`}
            className={cn(
                'inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors',
                'hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                state === 'playing' && 'text-accent',
                size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
                className,
            )}
        >
            {state === 'loading' ? (
                <Loader2 size={iconSize} className="animate-spin" aria-hidden="true" />
            ) : (
                <Volume2 size={iconSize} aria-hidden="true" />
            )}
        </button>
    )
}
