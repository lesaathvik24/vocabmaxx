interface PageHeaderProps {
    title: string
    description?: string
    eyebrow?: string
    actions?: React.ReactNode
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                {eyebrow && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
                        {eyebrow}
                    </p>
                )}
                <h1 className="font-display font-semibold text-2xl sm:text-3xl tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    )
}
