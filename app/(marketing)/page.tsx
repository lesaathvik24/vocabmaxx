import Link from 'next/link'
import Image from 'next/image'
import { Zap, Repeat, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const features = [
    {
        icon: Zap,
        title: 'Catch the word the second you meet it.',
        body: 'Type. Enter. Saved. We pull the cleanest definition + an example in under a second — dictionary first, AI when the word gets weird.',
    },
    {
        icon: Repeat,
        title: 'We bug you right before you forget.',
        body: 'SM-2 spaced repetition. The cards come back at the exact wrong-best moment. Reps you actually need, no busywork.',
    },
    {
        icon: Lock,
        title: 'Your vocabulary, in your pocket. Forever.',
        body: 'Search it. Export it (JSON/CSV). Walk away with it. Own it in your own database. No ads, no "premium tier." Built for the long game.',
    },
]

export default function MarketingPage() {
    return (
        <main className="min-h-screen flex flex-col bg-background text-foreground">
            <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
                <Link href="/" className="flex items-center gap-2.5">
                    <Image
                        src="/logo.png"
                        alt="VocabMaxx"
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-lg"
                        priority
                    />
                    <span className="font-display font-semibold text-base tracking-tight">VocabMaxx</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Link
                        href="/auth/sign-in"
                        className={cn(buttonVariants({ variant: 'ghost' }), 'text-sm')}
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/auth/sign-up"
                        className={cn(buttonVariants({ variant: 'accent' }), 'text-sm')}
                    >
                        Get started
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
                <div className="max-w-3xl mx-auto text-center space-y-7">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                        <Sparkles size={13} className="text-accent" aria-hidden="true" />
                        Stop renting words. Own them.
                    </div>
                    <h1 className="font-display font-semibold text-5xl sm:text-6xl tracking-tight leading-[1.05]">
                        Every word you Google twice
                        <br />
                        <span className="text-accent">is a leak.</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        VocabMaxx turns every word you almost knew into one you actually use.
                        Capture, review, own — in under a minute a day.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            href="/auth/sign-up"
                            className={cn(
                                buttonVariants({ variant: 'accent', size: 'lg' }),
                                'gap-2 h-12 px-7 text-base',
                            )}
                        >
                            Start for free
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                        <Link
                            href="/auth/sign-in"
                            className={cn(
                                buttonVariants({ variant: 'ghost', size: 'lg' }),
                                'h-12 px-5 text-base text-muted-foreground hover:text-foreground',
                            )}
                        >
                            I already have an account
                        </Link>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                        Free during beta. No card. No "AI credits." Just words.
                    </p>
                </div>
            </section>

            {/* Features */}
            <section className="px-6 pb-20">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
                    {features.map((f) => (
                        <article
                            key={f.title}
                            className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-3"
                        >
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                                <f.icon size={20} aria-hidden="true" />
                            </div>
                            <h3 className="font-display font-semibold text-lg leading-snug">{f.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                        </article>
                    ))}
                </div>
            </section>

            {/* Closer */}
            <section className="px-6 pb-24">
                <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-10 sm:p-14 text-center space-y-5">
                    <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight">
                        From <span className="text-muted-foreground line-through">heard once</span>{' '}
                        to <span className="text-accent">use in a meeting</span>.
                    </h2>
                    <p className="text-base text-muted-foreground max-w-md mx-auto">
                        Your future self will Google fewer words. Promise.
                    </p>
                    <Link
                        href="/auth/sign-up"
                        className={cn(
                            buttonVariants({ variant: 'accent', size: 'lg' }),
                            'gap-2 h-12 px-7 text-base',
                        )}
                    >
                        Capture your first word
                        <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                </div>
            </section>

            <footer className="mt-auto border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} VocabMaxx · Built for word people.
            </footer>
        </main>
    )
}
