'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AuthCardProps {
    mode: 'sign-in' | 'sign-up'
}

function GoogleIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    )
}

const COPY = {
    'sign-in': {
        title: 'Welcome back',
        subtitle: 'Sign in to keep capturing.',
        google: 'Continue with Google',
        emailCta: 'Send magic link',
        emailCtaLoading: 'Sending…',
        sentBody: (email: string) => (
            <>We sent a magic link to <strong>{email}</strong>. Open it on this device to sign in.</>
        ),
        switchPrompt: 'No account?',
        switchLabel: 'Sign up',
        switchHref: '/auth/sign-up',
    },
    'sign-up': {
        title: 'Start owning words',
        subtitle: 'Capture one. The rest follow.',
        google: 'Sign up with Google',
        emailCta: 'Create my account',
        emailCtaLoading: 'Creating…',
        sentBody: (email: string) => (
            <>Check <strong>{email}</strong> to confirm your account. It takes a few seconds.</>
        ),
        switchPrompt: 'Already have an account?',
        switchLabel: 'Sign in',
        switchHref: '/auth/sign-in',
    },
} as const

export function AuthCard({ mode }: AuthCardProps) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const copy = COPY[mode]
    const supabase = createClient()

    async function handleMagicLink(e: FormEvent) {
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
        setError(null)
        setLoading(true)
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
                skipBrowserRedirect: false,
            },
        })
        if (error) {
            setLoading(false)
            setError(error.message)
            return
        }
        if (data?.url) {
            window.location.href = data.url
        } else {
            setLoading(false)
            setError('Google sign-in is not enabled. Check Supabase → Auth → Providers → Google.')
        }
    }

    return (
        <main className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Top nav */}
            <nav className="flex items-center justify-between px-6 py-4">
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
                <Link
                    href={copy.switchHref}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    {copy.switchLabel}
                </Link>
            </nav>

            {/* Card */}
            <div className="flex flex-1 items-center justify-center px-4 pb-12">
                <div className="w-full max-w-sm">
                    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
                        <div className="text-center space-y-1.5">
                            <h1 className="font-display font-semibold text-2xl tracking-tight">
                                {copy.title}
                            </h1>
                            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
                        </div>

                        {sent ? (
                            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-5 text-center">
                                <CheckCircle2 size={28} className="text-success" aria-hidden="true" />
                                <p className="text-sm text-foreground/90">{copy.sentBody(email)}</p>
                            </div>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGoogle}
                                    disabled={loading}
                                    className="w-full h-11 gap-2.5 text-sm font-medium border-border hover:bg-muted"
                                >
                                    {loading ? (
                                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                    ) : (
                                        <GoogleIcon size={16} />
                                    )}
                                    {copy.google}
                                </Button>

                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                        or email
                                    </span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>

                                <form onSubmit={handleMagicLink} className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="auth-email" className="text-xs">
                                            Email address
                                        </Label>
                                        <div className="relative">
                                            <Mail
                                                size={15}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                                aria-hidden="true"
                                            />
                                            <Input
                                                id="auth-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                autoComplete="email"
                                                disabled={loading}
                                                className="pl-9 h-11 text-base"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-xs text-destructive" role="alert">
                                            {error}
                                        </p>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading || !email}
                                        variant="accent"
                                        className="w-full h-11 gap-2 text-sm font-medium"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                                {copy.emailCtaLoading}
                                            </>
                                        ) : (
                                            <>
                                                {copy.emailCta}
                                                <ArrowRight size={16} aria-hidden="true" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        {copy.switchPrompt}{' '}
                        <Link href={copy.switchHref} className="text-foreground font-medium hover:text-accent underline-offset-4 hover:underline">
                            {copy.switchLabel}
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
