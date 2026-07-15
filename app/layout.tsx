import type { Metadata } from 'next'
import { Inter, Inter_Tight, Source_Serif_4, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { PostHogProvider } from '@/lib/analytics/posthog'
import { QueryProvider } from '@/lib/providers/query-provider'
import { cn } from '@/lib/utils'
import { siteUrl, siteName, siteDescription } from '@/lib/site'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

const interTight = Inter_Tight({
    subsets: ['latin'],
    variable: '--font-inter-tight',
    weight: ['500', '600', '700'],
    display: 'swap',
})

const sourceSerif = Source_Serif_4({
    subsets: ['latin'],
    variable: '--font-source-serif',
    weight: ['400', '500', '600'],
    style: ['normal', 'italic'],
    display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains-mono',
    weight: ['400', '500'],
    display: 'swap',
})

const title = 'VocabMaxx — capture words, own them'

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: '%s — VocabMaxx' },
    description: siteDescription,
    applicationName: siteName,
    keywords: [
        'vocabulary builder',
        'spaced repetition',
        'SM-2',
        'flashcards',
        'SRS',
        'Anki alternative',
        'learn words',
    ],
    alternates: { canonical: '/' },
    openGraph: {
        type: 'website',
        url: siteUrl,
        siteName,
        title,
        description: siteDescription,
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description: siteDescription,
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn(
                inter.variable,
                interTight.variable,
                sourceSerif.variable,
                jetbrainsMono.variable,
            )}
        >
            <body>
                <ThemeProvider
                    attribute="class"
                    forcedTheme="light"
                    enableSystem={false}
                >
                    <PostHogProvider>
                        <QueryProvider>
                            {children}
                        </QueryProvider>
                        <Toaster richColors position="bottom-right" />
                    </PostHogProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
