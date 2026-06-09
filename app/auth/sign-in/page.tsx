'use client'

import { useState } from 'react'
import { createClient } from '@/lib/auth/client'
import Link from 'next/link'

export default function SignInPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    async function handleMagicLink(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
        })
        setLoading(false)
        if (error) setError(error.message)
        else setSent(true)
    }

    async function handleGoogle() {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${location.origin}/auth/callback` },
        })
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Sign in to VocabMaxx</h1>
                    <p className="text-slate-500 text-sm mt-1">Build your vocabulary every day</p>
                </div>

                {sent ? (
                    <p className="text-center text-sm text-slate-600 bg-slate-50 rounded-lg p-4 border border-slate-200">
                        Check your email — magic link sent to <strong>{email}</strong>
                    </p>
                ) : (
                    <>
                        <button
                            onClick={handleGoogle}
                            className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Sign in with Google
                        </button>

                        <div className="flex items-center gap-3">
                            <hr className="flex-1 border-slate-200" />
                            <span className="text-xs text-slate-400">or</span>
                            <hr className="flex-1 border-slate-200" />
                        </div>

                        <form onSubmit={handleMagicLink} className="space-y-3">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                            {error && <p className="text-red-600 text-xs">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Sending…' : 'Send magic link'}
                            </button>
                        </form>
                    </>
                )}

                <p className="text-center text-xs text-slate-500">
                    No account?{' '}
                    <Link href="/auth/sign-up" className="underline">Sign up</Link>
                </p>
            </div>
        </main>
    )
}
