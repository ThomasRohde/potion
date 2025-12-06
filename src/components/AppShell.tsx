/**
 * Main App Shell Layout
 * 
 * Core layout component with sidebar, topbar, and content area.
 * Responsive design with collapsible sidebar.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { PageSummary } from '../types'
import type { PageTreeNode } from '../services/pageService'
import { getOrCreateDefaultWorkspace, listPages, buildPageTree, createPage } from '../services'

interface AppShellProps {
    children?: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(280)
    const [pages, setPages] = useState<PageTreeNode[]>([])
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
    const [selectedPage, setSelectedPage] = useState<PageSummary | null>(null)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const refreshPages = useCallback(async (wsId: string) => {
        const pageSummaries = await listPages(wsId)
        const tree = buildPageTree(pageSummaries)
        setPages(tree)

        // If no page selected and we have pages, select the first one
        if (!selectedPageId && tree.length > 0) {
            setSelectedPageId(tree[0].id)
            setSelectedPage(tree[0])
        }
    }, [selectedPageId])

    // Initialize workspace and load pages
    useEffect(() => {
        async function init() {
            try {
                const workspace = await getOrCreateDefaultWorkspace()
                setWorkspaceId(workspace.id)
                await refreshPages(workspace.id)
            } catch (error) {
                console.error('Failed to initialize workspace:', error)
            } finally {
                setIsLoading(false)
            }
        }
        init()
    }, [refreshPages])

    const handlePageSelect = useCallback((page: PageSummary) => {
        setSelectedPageId(page.id)
        setSelectedPage(page)
    }, [])

    const handleCreatePage = useCallback(async (parentPageId?: string) => {
        if (!workspaceId) return

        const newPage = await createPage(workspaceId, 'Untitled', {
            parentPageId: parentPageId ?? null
        })

        await refreshPages(workspaceId)
        setSelectedPageId(newPage.id)
        setSelectedPage({
            id: newPage.id,
            workspaceId: newPage.workspaceId,
            parentPageId: newPage.parentPageId,
            title: newPage.title,
            type: newPage.type,
            isFavorite: newPage.isFavorite,
            icon: newPage.icon,
            createdAt: newPage.createdAt,
            updatedAt: newPage.updatedAt
        })
    }, [workspaceId, refreshPages])

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev)
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-potion-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading workspace...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex">
            {/* Sidebar */}
            <Sidebar
                pages={pages}
                selectedPageId={selectedPageId}
                collapsed={sidebarCollapsed}
                width={sidebarWidth}
                onWidthChange={setSidebarWidth}
                onPageSelect={handlePageSelect}
                onCreatePage={handleCreatePage}
                onToggleCollapse={toggleSidebar}
            />

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <Topbar
                    currentPage={selectedPage}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={toggleSidebar}
                />

                {/* Content */}
                <main className="flex-1 overflow-auto">
                    {children ?? (
                        <div className="max-w-4xl mx-auto px-8 py-12">
                            {selectedPage ? (
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                        {selectedPage.icon && <span className="mr-2">{selectedPage.icon}</span>}
                                        {selectedPage.title}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Start typing or press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">/</kbd> for commands
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                                        No pages yet. Create your first page!
                                    </p>
                                    <button
                                        onClick={() => handleCreatePage()}
                                        className="px-4 py-2 bg-potion-600 text-white rounded-lg hover:bg-potion-700 transition-colors"
                                    >
                                        Create a page
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
