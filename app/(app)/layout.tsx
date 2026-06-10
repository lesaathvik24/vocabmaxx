import { requireUser } from '@/lib/auth/server'
import { AppShell } from '@/components/layout/AppShell'
import { countDue } from '@/lib/db/queries/srs'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const user = await requireUser()
    const dueCount = await countDue(user.id, new Date())
    return <AppShell dueCount={dueCount}>{children}</AppShell>
}
