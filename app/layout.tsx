import type { Metadata } from 'next'
import { Inter, Inter_Tight, Source_Serif_4, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { PostHogProvider } from '@/lib/analytics/posthog'
import { QueryProvider } from '@/lib/providers/query-provider'
import { cn } from '@/lib/utils'
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

export const metadata: Metadata = {
    title: { default: 'VocabMaxx', template: '%s — VocabMaxx' },
    description: 'Capture words, own them. Spaced-repetition vocabulary builder.',
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
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange={false}
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
