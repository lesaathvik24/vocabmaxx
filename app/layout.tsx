import type { Metadata } from 'next'
import './globals.css'
import { PostHogProvider } from '@/lib/analytics/posthog'

export const metadata: Metadata = {
    title: { default: 'VocabMaxx', template: '%s — VocabMaxx' },
    description: 'Capture words, own them. Spaced-repetition vocabulary builder.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <PostHogProvider>{children}</PostHogProvider>
            </body>
        </html>
    )
}
