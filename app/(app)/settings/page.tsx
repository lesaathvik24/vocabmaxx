import { requireUser } from '@/lib/auth/server'
import * as preferencesService from '@/lib/services/preferences.service'
import { PageHeader } from '@/components/layout/PageHeader'
import { SettingsForm } from '@/components/settings/SettingsForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
    const user = await requireUser()
    const preferences = await preferencesService.get(user.id)

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <PageHeader
                title="Settings"
                description="Manage your profile, theme, notifications, and account."
            />
            <SettingsForm userEmail={user.email ?? ''} preferences={preferences} />
        </div>
    )
}
