import Link from 'next/link'
import { Plus, Layers, BarChart3, ArrowRight, Play } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const steps = [
    {
        icon: Plus,
        title: '1 · Capture',
        body: 'Type or paste any word. We fetch the definition, phonetics and real example sentences instantly.',
    },
    {
        icon: Layers,
        title: '2 · Review',
        body: 'A few cards a day. Grade how well you knew it and the schedule adapts to your memory.',
    },
    {
        icon: BarChart3,
        title: '3 · Master',
        body: 'Watch retention climb. Sidequests and streaks keep the habit alive without the grind.',
    },
]

const previewRows = [
    { dot: '#e8863b', term: 'alacrity', gloss: 'brisk and cheerful readiness', tint: false },
    { dot: '#2f5bea', term: 'ephemeral', gloss: 'lasting for a very short time', tint: true },
    { dot: '#1f9e6a', term: 'ubiquitous', gloss: 'present everywhere at once', tint: false },
]

export default function MarketingPage() {
    return (
        <main className="flex min-h-screen flex-col bg-background text-foreground">
            {/* Glass nav */}
            <nav className="glass-bar sticky top-0 z-30 flex h-16 items-center gap-4 px-6">
                <Link href="/" className="flex items-center gap-2.5">
                    <span className="bg-logo-gradient flex h-7 w-7 items-center justify-center rounded-[9px] text-sm font-bold text-white">
                        V
                    </span>
                    <span className="font-display text-base font-semibold tracking-tight">VocabMaxx</span>
                </Link>
                <div className="ml-6 hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
                    <span>Features</span>
                    <span>How it works</span>
                    <span>Pricing</span>
                </div>
                <div className="flex-1" />
                <Link href="/auth/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Sign in
                </Link>
                <Link
                    href="/auth/sign-up"
                    className={cn(
                        buttonVariants({ variant: 'accent' }),
                        'h-9 px-4 text-sm shadow-[0_8px_20px_-8px_rgba(47,91,234,.6)]',
                    )}
                >
                    Get started
                </Link>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden px-6 pt-[74px] pb-8 text-center">
                <div
                    className="pointer-events-none absolute -top-28 left-1/2 h-[420px] w-[680px] max-w-full -translate-x-1/2"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(79,119,255,.16), transparent 68%)' }}
                    aria-hidden="true"
                />
                <div className="relative mx-auto max-w-3xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 text-[13px] font-semibold text-accent">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                        Now with AI-generated example sentences
                    </div>
                    <h1 className="mx-auto max-w-[760px] font-display text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
                        Every word you meet,
                        <br />
                        remembered for good.
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">
                        Capture a word in one tap. VocabMaxx writes the definition, builds the flashcard, and schedules it so
                        it sticks — using spaced repetition that adapts to you.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href="/auth/sign-up"
                            className={cn(
                                buttonVariants({ variant: 'accent', size: 'lg' }),
                                'h-[52px] gap-2 px-6 text-base shadow-[0_14px_30px_-12px_rgba(47,91,234,.65)]',
                            )}
                        >
                            Start learning free
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                        <Link
                            href="/auth/sign-in"
                            className={cn(
                                buttonVariants({ variant: 'outline', size: 'lg' }),
                                'h-[52px] gap-2 px-6 text-base',
                            )}
                        >
                            <Play size={15} aria-hidden="true" className="fill-current" />
                            Watch demo
                        </Link>
                    </div>
                    <p className="num mt-4 text-[13px] text-faint">Free forever · No card required · 12,000+ learners</p>
                </div>

                {/* Product shot */}
                <div className="relative mx-auto mt-12 w-full max-w-[720px] overflow-hidden rounded-t-[20px] border border-b-0 border-[#e6e9f0] bg-card shadow-[0_40px_80px_-40px_rgba(20,30,60,.4)]">
                    <div className="flex h-9 items-center gap-1.5 border-b border-border bg-[#f2f4f9] px-4">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex flex-col gap-4 p-6 text-left sm:flex-row">
                        <div className="bg-hero-gradient flex-1 rounded-2xl p-5 text-white">
                            <div className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">Due now</div>
                            <div className="num mt-1 text-[34px] font-bold tracking-tight">
                                12 <span className="text-[15px] font-medium opacity-85">cards</span>
                            </div>
                            <div className="mt-5 inline-flex h-9 items-center rounded-[10px] bg-white px-4 text-[13px] font-semibold text-accent">
                                Start review →
                            </div>
                        </div>
                        <div className="flex flex-[1.3] flex-col gap-2.5">
                            {previewRows.map((r) => (
                                <div
                                    key={r.term}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-3.5 py-3',
                                        r.tint ? 'bg-background' : 'border border-border',
                                    )}
                                >
                                    <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: r.dot }} />
                                    <div className="min-w-0">
                                        <div className="text-[13.5px] font-semibold">{r.term}</div>
                                        <div className="truncate text-xs text-faint">{r.gloss}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="border-t border-border bg-card px-6 py-14">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-10 text-center">
                        <div className="text-[13px] font-semibold uppercase tracking-[0.1em] text-accent">How it works</div>
                        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Three steps. Zero busywork.</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {steps.map((s) => (
                            <article
                                key={s.title}
                                className="rounded-[18px] border border-line-2 bg-background p-6"
                            >
                                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[13px] bg-accent-soft text-accent">
                                    <s.icon size={22} aria-hidden="true" />
                                </div>
                                <h3 className="text-[17px] font-semibold tracking-tight">{s.title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto flex flex-col gap-3 bg-[#0e1220] px-6 py-8 text-sm sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5">
                    <span className="bg-logo-gradient flex h-6 w-6 items-center justify-center rounded-[7px] text-[13px] font-bold text-white">
                        V
                    </span>
                    <span className="font-semibold text-white">VocabMaxx</span>
                    <span className="ml-2 text-[13px] text-[#6b7286]">
                        © {new Date().getFullYear()} · Learn a little every day
                    </span>
                </div>
                <div className="flex gap-6 text-[13px] text-[#9aa0b0] sm:ml-auto">
                    <span>Privacy</span>
                    <span>Terms</span>
                    <span>Contact</span>
                </div>
            </footer>
        </main>
    )
}
