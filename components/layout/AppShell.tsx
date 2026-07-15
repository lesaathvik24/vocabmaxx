import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileTabBar } from './MobileTabBar'
import { QuickCaptureProvider } from '@/components/capture/QuickCaptureProvider'

interface AppShellProps {
    children: React.ReactNode
    dueCount?: number
    userEmail: string
    displayName?: string | null
}

export function AppShell({ children, dueCount = 0, userEmail, displayName }: AppShellProps) {
    return (
        <QuickCaptureProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Desktop sidebar */}
                <div className="hidden md:flex flex-shrink-0">
                    <Sidebar dueCount={dueCount} userEmail={userEmail} displayName={displayName} />
                </div>

                {/* Main column */}
                <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                    <Topbar dueCount={dueCount} userEmail={userEmail} displayName={displayName} />
                    <main className="flex-1 overflow-y-auto">
                        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
                            {children}
                        </div>
                    </main>
                </div>
                <MobileTabBar />
            </div>
        </QuickCaptureProvider>
    )
}
