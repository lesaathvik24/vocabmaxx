import { requireUser } from '@/lib/auth/server'
import * as preferencesService from '@/lib/services/preferences.service'
import { SettingsForm } from '@/components/settings/SettingsForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
    const user = await requireUser()
    const preferences = await preferencesService.get(user.id)

    return (
        <div className="mx-auto max-w-2xl py-6 px-4 space-y-6">
            <div>
                <h1 className="font-display text-2xl font-semibold">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your profile, theme, notifications, and account.
                </p>
            </div>
            <SettingsForm userEmail={user.email ?? ''} preferences={preferences} />
        </div>
    )
}
