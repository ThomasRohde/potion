/**
 * HomePage Component
 * 
 * Landing page when no specific page is selected.
 * Redirects to first available page or shows empty state.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { getOrCreateDefaultWorkspace, listPages, createPage } from '../services'
import type { PageSummary } from '../types'

export function HomePage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)

    useEffect(() => {
        async function init() {
            try {
                const workspace = await getOrCreateDefaultWorkspace()
                setWorkspaceId(workspace.id)

                const pages: PageSummary[] = await listPages(workspace.id)

                // If there are pages, navigate to the first one
                if (pages.length > 0) {
                    // Find the first root page (no parent)
                    const rootPages = pages.filter((p: PageSummary) => !p.parentPageId)
                    if (rootPages.length > 0) {
                        navigate(`/page/${rootPages[0].id}`, { replace: true })
                        return
                    }
                    // Fallback to first page
                    navigate(`/page/${pages[0].id}`, { replace: true })
                    return
                }
            } catch (error) {
                console.error('Failed to initialize:', error)
            } finally {
                setIsLoading(false)
            }
        }

        init()
    }, [navigate])

    const handleCreatePage = async () => {
        if (!workspaceId) return

        try {
            const newPage = await createPage(workspaceId, 'Untitled')
            navigate(`/page/${newPage.id}`)
        } catch (error) {
            console.error('Failed to create page:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-8 py-12">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-8 py-12 text-center">
            <FlaskConical className="w-16 h-16 mx-auto mb-4 text-potion-600 dark:text-potion-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Potion
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
                Your private, offline-first workspace. No data ever leaves your device.
            </p>
            <button
                onClick={handleCreatePage}
                className="px-6 py-3 bg-potion-600 text-white rounded-lg hover:bg-potion-700 transition-colors text-lg"
            >
                Create your first page
            </button>
        </div>
    )
}
