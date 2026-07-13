'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { QuickCaptureDialog } from './QuickCaptureDialog'

interface QuickCaptureContextValue {
    openQuickCapture: () => void
}

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null)

export function useQuickCapture(): QuickCaptureContextValue {
    const ctx = useContext(QuickCaptureContext)
    if (!ctx) throw new Error('useQuickCapture must be used within QuickCaptureProvider')
    return ctx
}

export function QuickCaptureProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)

    const openQuickCapture = useCallback(() => setOpen(true), [])

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const value = useMemo(() => ({ openQuickCapture }), [openQuickCapture])

    return (
        <QuickCaptureContext.Provider value={value}>
            {children}
            <QuickCaptureDialog open={open} onOpenChange={setOpen} />
        </QuickCaptureContext.Provider>
    )
}
