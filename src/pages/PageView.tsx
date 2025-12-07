/**
 * PageView Component
 * 
 * Displays a page based on the URL parameter :id
 * Handles loading states and not-found scenarios.
 * Implements auto-save with debounce and status indicator.
 * For database pages, renders the DatabasePage component instead of the editor.
 */

import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPage, getOrCreateDefaultWorkspace, updatePageContent, updatePageTitle, listPages } from '../services'
import { SaveStatusIndicator, DatabasePage, PageIcon } from '../components'
import { useAutoSave } from '../hooks'
import { useWorkspaceStore } from '../stores'
import type { Page, BlockContent } from '../types'

// Lazy load the RichTextEditor for better initial page load performance
// BlockNote is a large dependency (~1MB) that doesn't need to be in the initial bundle
const RichTextEditor = lazy(() =>
    import('../components/RichTextEditor').then(module => ({
        default: module.RichTextEditor
    }))
)

/**
 * Loading placeholder for the RichTextEditor.
 * Shows a skeleton that mimics the editor's appearance.
 */
function EditorLoadingFallback() {
    return (
        <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
    )
}

export function PageView() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const refreshPages = useWorkspaceStore(state => state.refreshPages)
    const workspaceId = useWorkspaceStore(state => state.workspaceId)
    // Get isFullWidth from the store to react to changes without full page reload
    const storePages = useWorkspaceStore(state => state.pages)
    const storePageData = storePages.find(p => p.id === id)

    const [page, setPage] = useState<Page | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editorContent, setEditorContent] = useState<BlockContent | null>(null)

    useEffect(() => {
        async function loadPage() {
            if (!id) {
                setError('No page ID provided')
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                setError(null)

                // Ensure workspace is initialized
                await getOrCreateDefaultWorkspace()

                const loadedPage = await getPage(id)
                if (loadedPage) {
                    setPage(loadedPage)
                    setEditorContent(loadedPage.content)
                } else {
                    setError('Page not found')
                }
            } catch (err) {
                console.error('Failed to load page:', err)
                setError('Failed to load page')
            } finally {
                setIsLoading(false)
            }
        }

        loadPage()
    }, [id])

    // Sync isFullWidth from store to local page state when it changes
    useEffect(() => {
        if (storePageData && page && storePageData.isFullWidth !== page.isFullWidth) {
            setPage(prev => prev ? { ...prev, isFullWidth: storePageData.isFullWidth } : null)
        }
    }, [storePageData?.isFullWidth, page?.isFullWidth, storePageData, page])

    // Save function for auto-save hook
    const saveContent = useCallback(async (content: BlockContent) => {
        if (!page) return

        await updatePageContent(page.id, content)
        // Update local page state after successful save
        setPage(prev => prev ? { ...prev, content } : null)
    }, [page])

    // Auto-save hook with 1 second debounce
    const { status } = useAutoSave({
        data: editorContent || { version: 1, blocks: [] },
        onSave: saveContent,
        debounceMs: 1000,
        enabled: !!page && !!editorContent && page.type !== 'database',
        onError: (err) => console.error('Auto-save failed:', err)
    })

    // Handle content changes from the editor
    const handleContentChange = useCallback((content: BlockContent) => {
        setEditorContent(content)
    }, [])

    // Handle title change for database pages
    const handleTitleChange = useCallback(async (title: string) => {
        if (!page) return
        await updatePageTitle(page.id, title)
        setPage(prev => prev ? { ...prev, title } : null)
        // Refresh sidebar to show updated title
        if (workspaceId) {
            const pageSummaries = await listPages(workspaceId)
            refreshPages(pageSummaries)
        }
    }, [page, workspaceId, refreshPages])

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-8 py-12">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-8 py-12 text-center">
                <PageIcon type="page" size="xl" className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {error === 'Page not found' ? 'Page Not Found' : 'Error'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {error === 'Page not found'
                        ? "The page you're looking for doesn't exist or has been deleted."
                        : error
                    }
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-potion-600 text-white rounded-lg hover:bg-potion-700 transition-colors"
                >
                    Go to Home
                </button>
            </div>
        )
    }

    if (!page) {
        return null
    }

    // Render database page differently
    if (page.type === 'database') {
        return <DatabasePage page={page} onTitleChange={handleTitleChange} />
    }

    // Determine container width class based on page's full width preference
    const containerClass = page.isFullWidth
        ? 'w-full px-8 py-8'
        : 'max-w-4xl mx-auto px-8 py-8'

    return (
        <div className={containerClass}>
            <div className="flex items-center justify-end mb-6">
                <SaveStatusIndicator status={status} />
            </div>
            <Suspense fallback={<EditorLoadingFallback />}>
                <RichTextEditor
                    key={page.id} // Re-mount editor when page changes
                    initialContent={page.content}
                    onChange={handleContentChange}
                />
            </Suspense>
        </div>
    )
}
