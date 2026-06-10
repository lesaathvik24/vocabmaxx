import { requireUser } from '@/lib/auth/server'
import { AppShell } from '@/components/layout/AppShell'
import { countDue } from '@/lib/db/queries/srs'
import * as preferencesService from '@/lib/services/preferences.service'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const user = await requireUser()
    const [dueCount, prefs] = await Promise.all([
        countDue(user.id, new Date()),
        preferencesService.get(user.id),
    ])
    return (
        <AppShell dueCount={dueCount} userEmail={user.email ?? ''} displayName={prefs.displayName}>
            {children}
        </AppShell>
    )
}
