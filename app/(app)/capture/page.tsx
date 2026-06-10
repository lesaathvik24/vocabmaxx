import { CapturePageClient } from './CapturePageClient'

export const metadata = { title: 'Capture' }

export default function CapturePage() {
    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Add to your vocabulary
                </p>
                <h1 className="font-display font-semibold text-2xl sm:text-3xl mt-1">Capture</h1>
            </div>
            <CapturePageClient />
        </div>
    )
}
