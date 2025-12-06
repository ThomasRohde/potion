/**
 * PageView Component
 * 
 * Displays a page based on the URL parameter :id
 * Handles loading states and not-found scenarios.
 * Implements auto-save with debounce and status indicator.
 * For database pages, renders the DatabasePage component instead of the editor.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPage, getOrCreateDefaultWorkspace, updatePageContent, updatePageTitle } from '../services'
import { RichTextEditor, SaveStatusIndicator, DatabasePage } from '../components'
import { useAutoSave } from '../hooks'
import { usePageContext } from '../contexts'
import type { Page, BlockContent } from '../types'

export function PageView() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { refreshPages } = usePageContext()
    const [page, setPage] = useState<Page | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editorContent, setEditorContent] = useState<BlockContent | null>(null)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editTitle, setEditTitle] = useState('')
    const titleInputRef = useRef<HTMLInputElement>(null)

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
        await refreshPages()
    }, [page, refreshPages])

    // Focus title input when editing starts
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus()
            titleInputRef.current.select()
        }
    }, [isEditingTitle])

    const handleTitleClick = () => {
        if (page) {
            setEditTitle(page.title || 'Untitled')
            setIsEditingTitle(true)
        }
    }

    const handleTitleSubmit = async () => {
        if (page && editTitle.trim()) {
            await handleTitleChange(editTitle.trim())
        }
        setIsEditingTitle(false)
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSubmit()
        } else if (e.key === 'Escape') {
            setEditTitle(page?.title || 'Untitled')
            setIsEditingTitle(false)
        }
    }

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

    // Render database page differently
    if (page.type === 'database') {
        return <DatabasePage page={page} onTitleChange={handleTitleChange} />
    }

    return (
        <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {page.icon && <span className="text-3xl">{page.icon}</span>}
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={handleTitleKeyDown}
                            className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-potion-500 outline-none flex-1 min-w-0"
                        />
                    ) : (
                        <h1
                            onClick={handleTitleClick}
                            className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 -mx-2 rounded transition-colors"
                            title="Click to edit title"
                        >
                            {page.title || 'Untitled'}
                        </h1>
                    )}
                </div>
                <SaveStatusIndicator status={status} />
            </div>
            <RichTextEditor
                key={page.id} // Re-mount editor when page changes
                initialContent={page.content}
                onChange={handleContentChange}
            />
        </div>
    )
}
