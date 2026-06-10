import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileAddFab } from './MobileAddFab'

interface AppShellProps {
    children: React.ReactNode
    dueCount?: number
    userEmail: string
}

export function AppShell({ children, dueCount = 0, userEmail }: AppShellProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop sidebar */}
            <div className="hidden md:flex flex-shrink-0">
                <Sidebar dueCount={dueCount} userEmail={userEmail} />
            </div>

            {/* Main column */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <Topbar dueCount={dueCount} userEmail={userEmail} />
                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-6">
                        {children}
                    </div>
                </main>
            </div>
            <MobileAddFab />
        </div>
    )
}
