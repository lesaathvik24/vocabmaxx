'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, BellRing } from 'lucide-react'
import { enablePush, disablePush, getPushStatus, type PushStatus } from '@/lib/push/client'
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
                <CardDescription>Reminders when words are due for review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <BrowserNotificationsRow />
                <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
                    <div>
                        <p className="text-sm font-medium">Daily email digest</p>
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

function BrowserNotificationsRow() {
    const [status, setStatus] = useState<PushStatus | 'loading'>('loading')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        getPushStatus()
            .then(setStatus)
            .catch(() => setStatus('unsupported'))
    }, [])

    async function enable() {
        setBusy(true)
        try {
            await enablePush()
            setStatus('subscribed')
            toast.success('Browser notifications enabled on this device.')
        } catch (e) {
            setStatus(await getPushStatus().catch(() => 'unsupported' as const))
            toast.error(e instanceof Error ? e.message : 'Could not enable notifications.')
        } finally {
            setBusy(false)
        }
    }

    async function disable() {
        setBusy(true)
        try {
            await disablePush()
            setStatus('unsubscribed')
            toast.success('Browser notifications disabled on this device.')
        } finally {
            setBusy(false)
        }
    }

    const description = {
        loading: 'Checking this device…',
        unsupported: 'This browser does not support push notifications.',
        unconfigured: 'Not available on this deployment.',
        blocked: 'Blocked — allow notifications for this site in your browser settings.',
        subscribed: 'This device gets a reminder when words are due.',
        unsubscribed: 'Get a reminder on this device when words are due.',
    }[status]

    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
                <BellRing size={18} className="mt-0.5 text-muted-foreground" aria-hidden="true" />
                <div>
                    <p className="text-sm font-medium">Browser notifications</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
            {status === 'subscribed' ? (
                <Button variant="outline" onClick={disable} disabled={busy}>
                    {busy && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                    Disable
                </Button>
            ) : (
                <Button
                    variant="accent"
                    onClick={enable}
                    disabled={busy || status === 'loading' || status === 'unsupported' || status === 'unconfigured' || status === 'blocked'}
                >
                    {busy && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                    Enable
                </Button>
            )}
        </div>
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

