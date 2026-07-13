import { PageHeader } from '@/components/layout/PageHeader'
import { CapturePageClient } from './CapturePageClient'

export const metadata = { title: 'Capture' }

export default function CapturePage() {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Add to your vocabulary"
                title="Capture"
                description="One word, a paragraph, or a whole file — definitions are fetched for you."
            />
            <CapturePageClient />
        </div>
    )
}
