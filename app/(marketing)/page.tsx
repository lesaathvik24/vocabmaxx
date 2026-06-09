import Link from 'next/link'

const features = [
    { title: 'One-click capture', description: 'Add any word from anywhere — browser extension, paste, or type.' },
    { title: 'Smart definitions', description: 'Dictionary-first lookup with AI fallback. Always get context and examples.' },
    { title: 'SM-2 spaced repetition', description: 'Reviews appear exactly when your brain is about to forget. No wasted sessions.' },
    { title: 'Your vocabulary, exported', description: 'Full JSON / CSV / Anki export at any time. Your data stays yours.' },
]

export default function MarketingPage() {
    return (
        <main className="min-h-screen flex flex-col">
            <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <span className="font-bold text-lg tracking-tight">VocabMaxx</span>
                <div className="flex gap-4 text-sm">
                    <Link href="/auth/sign-in" className="text-slate-600 hover:text-slate-900">Sign in</Link>
                    <Link href="/auth/sign-up" className="bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-700">
                        Get started
                    </Link>
                </div>
            </nav>

            <section className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center gap-6">
                <h1 className="text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
                    Capture words. Own them.
                </h1>
                <p className="text-xl text-slate-500 max-w-lg">
                    VocabMaxx turns every unknown word into a lasting memory using spaced repetition.
                    Stop re-looking up the same words.
                </p>
                <Link href="/auth/sign-up" className="bg-slate-900 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-slate-700 transition-colors">
                    Start for free
                </Link>
            </section>

            <section className="px-6 py-16 bg-slate-50">
                <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {features.map(f => (
                        <div key={f.title} className="bg-white rounded-xl p-6 border border-slate-200">
                            <h3 className="font-semibold mb-1">{f.title}</h3>
                            <p className="text-sm text-slate-500">{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200">
                © {new Date().getFullYear()} VocabMaxx
            </footer>
        </main>
    )
}
