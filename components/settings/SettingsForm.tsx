'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import type { UserPreferences } from '@/lib/services/preferences.service'
import { DeleteAccountDialog } from './DeleteAccountDialog'

export interface SettingsFormProps {
    userEmail: string
    preferences: UserPreferences
}

/** PATCH a partial preference change; returns true on success. */
async function patchPreferences(patch: Partial<UserPreferences>): Promise<boolean> {
    const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
    })
    return res.ok
}

export function SettingsForm({ userEmail, preferences }: SettingsFormProps) {
    return (
        <div className="space-y-6">
            <ProfileSection userEmail={userEmail} displayName={preferences.displayName} />
            <ThemeSection initialTheme={preferences.theme} />
            <NotificationsSection
                initialEnabled={preferences.dailyDigest}
                initialHour={preferences.digestHour}
            />
            <DangerZone />
        </div>
    )
}

/** UTC hours, labelled so the user can see the offset. */
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
    value: h,
    label: `${String(h).padStart(2, '0')}:00 UTC`,
}))

function NotificationsSection({
    initialEnabled,
    initialHour,
}: {
    initialEnabled: boolean
    initialHour: number
}) {
    const [enabled, setEnabled] = useState(initialEnabled)
    const [hour, setHour] = useState(initialHour)
    const [saving, setSaving] = useState(false)

    async function persist(next: { dailyDigest?: boolean; digestHour?: number }) {
        setSaving(true)
        const ok = await patchPreferences(next)
        setSaving(false)
        if (ok) toast.success('Notification settings saved.')
        else toast.error('Could not save notification settings.')
        return ok
    }

    async function toggle() {
        const next = !enabled
        setEnabled(next)
        const ok = await persist({ dailyDigest: next })
        if (!ok) setEnabled(!next)
    }

    async function changeHour(next: number) {
        const previous = hour
        setHour(next)
        const ok = await persist({ digestHour: next })
        if (!ok) setHour(previous)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>A daily email digest of the words due for review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium">Daily digest</p>
                        <p className="text-sm text-muted-foreground">
                            Email me when I have words due.
                        </p>
                    </div>
                    <Button
                        role="switch"
                        aria-checked={enabled}
                        aria-label="Daily digest"
                        variant={enabled ? 'default' : 'outline'}
                        onClick={toggle}
                        disabled={saving}
                    >
                        {enabled ? 'On' : 'Off'}
                    </Button>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="digestHour">Send at</Label>
                    <select
                        id="digestHour"
                        value={hour}
                        disabled={!enabled || saving}
                        onChange={(e) => changeHour(Number(e.target.value))}
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50"
                    >
                        {HOUR_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
            </CardContent>
        </Card>
    )
}

function DangerZone() {
    return (
        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="text-destructive">Danger zone</CardTitle>
                <CardDescription>
                    Permanently delete your account and all of your data.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DeleteAccountDialog />
            </CardContent>
        </Card>
    )
}

function ProfileSection({
    userEmail,
    displayName,
}: {
    userEmail: string
    displayName: string | null
}) {
    const [name, setName] = useState(displayName ?? '')
    const [saving, setSaving] = useState(false)

    async function save() {
        setSaving(true)
        const ok = await patchPreferences({ displayName: name.trim() || null })
        setSaving(false)
        if (ok) toast.success('Profile updated.')
        else toast.error('Could not save your profile.')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>How VocabMaxx greets you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={userEmail} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="displayName">Display name</Label>
                    <Input
                        id="displayName"
                        value={name}
                        maxLength={80}
                        placeholder="Your name"
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <Button onClick={save} disabled={saving}>
                    {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                    Save profile
                </Button>
            </CardContent>
        </Card>
    )
}

function ThemeSection({ initialTheme }: { initialTheme: 'light' | 'dark' }) {
    const { setTheme } = useTheme()
    const [selected, setSelected] = useState<'light' | 'dark'>(initialTheme)
    const [saving, setSaving] = useState(false)

    async function choose(next: 'light' | 'dark') {
        if (next === selected) return
        const previous = selected
        setSelected(next)
        setTheme(next) // immediate visual change via next-themes
        setSaving(true)
        const ok = await patchPreferences({ theme: next })
        setSaving(false)
        if (ok) {
            toast.success('Theme saved.')
        } else {
            setSelected(previous)
            setTheme(previous)
            toast.error('Could not save your theme.')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Pick light or dark. Saved to your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <div role="radiogroup" aria-label="Theme" className="flex gap-2">
                    {(['light', 'dark'] as const).map((t) => (
                        <Button
                            key={t}
                            role="radio"
                            aria-checked={selected === t}
                            variant={selected === t ? 'default' : 'outline'}
                            onClick={() => choose(t)}
                            disabled={saving}
                            className="capitalize"
                        >
                            {t}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
