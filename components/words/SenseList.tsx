import type { Sense } from '@/lib/domain/word'
import { cn } from '@/lib/utils'

interface SenseListProps {
    senses: Sense[]
    /** Compact spacing + smaller type, for cards and the flashcard back. */
    dense?: boolean
    className?: string
}

/**
 * Renders every meaning of a word, numbered, primary first. Words captured
 * before multi-sense support have a single synthesised sense — see
 * `toSenses` for the fallback.
 */
export function SenseList({ senses, dense = false, className }: SenseListProps) {
    const numbered = senses.length > 1

    return (
        <ol className={cn(dense ? 'space-y-3' : 'space-y-4', className)}>
            {senses.map((sense, i) => (
                <li key={i} className="flex gap-2.5">
                    {numbered && (
                        <span
                            className={cn(
                                'flex-shrink-0 select-none font-mono text-muted-foreground',
                                dense ? 'text-[11px] leading-6' : 'text-xs leading-7',
                            )}
                        >
                            {i + 1}.
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className={cn('leading-relaxed', dense ? 'text-sm' : 'text-base')}>
                            {sense.partOfSpeech && (
                                <span className="mr-2 font-serif text-sm italic text-accent">
                                    {sense.partOfSpeech}
                                </span>
                            )}
                            <span className="font-serif">{sense.definition}</span>
                        </p>
                        {sense.examples.length > 0 && (
                            <ul className={cn('space-y-1', dense ? 'mt-1.5' : 'mt-2')}>
                                {sense.examples.map((ex, j) => (
                                    <li
                                        key={j}
                                        className={cn(
                                            'border-l-2 border-border pl-3 font-serif italic text-muted-foreground',
                                            dense ? 'text-xs' : 'text-sm',
                                        )}
                                    >
                                        {ex}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </li>
            ))}
        </ol>
    )
}

/**
 * Senses for a word, falling back to a single synthesised sense for rows
 * captured before multi-sense support landed.
 */
export function toSenses(
    senses: Sense[] | null | undefined,
    definition: string,
    examples: string[],
): Sense[] {
    if (senses && senses.length > 0) return senses
    return [{ partOfSpeech: null, definition, examples }]
}
