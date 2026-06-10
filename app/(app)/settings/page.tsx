import { Sliders } from 'lucide-react'
import { ComingSoon } from '@/components/layout/ComingSoon'

export const metadata = { title: 'Settings' }

export default function SettingsPage() {
    return (
        <ComingSoon
            icon={Sliders}
            title="Settings unlock soon"
            body="Profile, theme, notifications, export, and your danger zone — landing in the next drop. Theme toggle is already live in the top bar."
        />
    )
}
