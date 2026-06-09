import { requireUser } from '@/lib/auth/server'

export default async function DashboardPage() {
    const user = await requireUser()

    return (
        <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-1">Welcome, {user.email}</h1>
            <p className="text-slate-500 mb-8">Your vocabulary dashboard</p>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
                <p className="text-4xl font-bold">0</p>
                <p className="text-slate-500 mt-1">words due for review</p>
            </div>
        </main>
    )
}
