import { createClient } from '@/lib/auth/server'
import { SignOutButton } from '@/components/layout/sign-out-button'
import { SentryTestButton } from '@/components/debug/sentry-test-button'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const user = data.user!

    return (
        <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
            <div className="flex items-start justify-between mb-1">
                <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
                <SignOutButton />
            </div>
            <p className="text-slate-500 mb-8">Your vocabulary dashboard</p>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
                <p className="text-4xl font-bold">0</p>
                <p className="text-slate-500 mt-1">words due for review</p>
            </div>
            <SentryTestButton />
        </main>
    )
}
