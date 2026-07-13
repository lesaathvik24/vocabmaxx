'use client'

import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useQuickCapture } from '@/components/capture/QuickCaptureProvider'

export function MobileAddFab() {
    const pathname = usePathname()
    const { openQuickCapture } = useQuickCapture()
    if (pathname.startsWith('/capture')) return null

    return (
        <button
            type="button"
            onClick={openQuickCapture}
            aria-label="Add a new word"
            className="md:hidden fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 transition-transform"
        >
            <Plus size={26} aria-hidden="true" />
        </button>
    )
}
