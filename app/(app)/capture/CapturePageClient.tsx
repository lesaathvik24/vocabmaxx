'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AddWordInput } from '@/components/capture/AddWordInput'
import { ParagraphExtractor } from '@/components/capture/ParagraphExtractor'
import { BulkUploader } from '@/components/capture/BulkUploader'
import { useCapture } from '@/lib/hooks/use-capture'
import { useExtract } from '@/lib/hooks/use-extract'
import { useBulkImport } from '@/lib/hooks/use-bulk-import'
import { toUserMessage } from '@/lib/utils/errors'

export function CapturePageClient() {
    const router = useRouter()
    const captureMutation = useCapture()
    const extractMutation = useExtract()
    const bulkImportMutation = useBulkImport()

    async function handleCapture(term: string): Promise<{ ok: boolean; error?: string }> {
        try {
            await captureMutation.mutateAsync(term)
            router.refresh()
            return { ok: true }
        } catch (err) {
            const kind = err instanceof Error ? err.message : 'unknown'
            return { ok: false, error: toUserMessage(kind) }
        }
    }

    async function handleExtract(text: string): Promise<string[]> {
        return extractMutation.mutateAsync(text)
    }

    async function handleSaveSelected(terms: string[]): Promise<{ added: number; skipped: number; failed: number }> {
        const summary = await bulkImportMutation.mutateAsync(terms)
        router.refresh()
        return summary
    }

    async function handleBulkUpload(terms: string[]): Promise<{ added: number; skipped: number; failed: number }> {
        const summary = await bulkImportMutation.mutateAsync(terms)
        router.refresh()
        return summary
    }

    return (
        <Tabs defaultValue="single" className="space-y-6">
            <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="single" className="flex-1 sm:flex-none">Single</TabsTrigger>
                <TabsTrigger value="paragraph" className="flex-1 sm:flex-none">Paragraph</TabsTrigger>
                <TabsTrigger value="bulk" className="flex-1 sm:flex-none">Bulk</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-display text-lg">Add a word</CardTitle>
                        <CardDescription>
                            Type or paste a word. We&rsquo;ll fetch the definition automatically.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddWordInput
                            onSubmit={handleCapture}
                            loading={captureMutation.isPending}
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="paragraph">
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-display text-lg">Extract from text</CardTitle>
                        <CardDescription>
                            Paste a paragraph or article — AI will surface the vocabulary-worthy words.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ParagraphExtractor
                            onExtract={handleExtract}
                            onSaveSelected={handleSaveSelected}
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="bulk">
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-display text-lg">Bulk import</CardTitle>
                        <CardDescription>
                            Upload a .txt file with one word per line to import in batch.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <BulkUploader onUpload={handleBulkUpload} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
