/**
 * PageView Component
 * 
 * Displays a page based on the URL parameter :id
 * Handles loading states and not-found scenarios.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPage, getOrCreateDefaultWorkspace } from '../services'
import type { Page } from '../types'

export function PageView() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [page, setPage] = useState<Page | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
                <div className="text-6xl mb-4">📄</div>
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

    return (
        <div className="max-w-4xl mx-auto px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {page.icon && <span className="mr-2">{page.icon}</span>}
                {page.title || 'Untitled'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
                Start typing or press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">/</kbd> for commands
            </p>
            {/* BlockNote editor will be integrated here in F006 */}
        </div>
    )
}
