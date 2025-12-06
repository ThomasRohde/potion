/**
 * Main App Shell Layout
 * 
 * Core layout component with sidebar, topbar, and content area.
 * Responsive design with collapsible sidebar.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { PageSummary } from '../types'
import type { PageTreeNode } from '../services/pageService'
import { getOrCreateDefaultWorkspace, listPages, buildPageTree, createPage, getPage } from '../services'

interface AppShellProps {
    children?: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const navigate = useNavigate()
    const location = useLocation()
    
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(280)
    const [pages, setPages] = useState<PageTreeNode[]>([])
    const [currentPage, setCurrentPage] = useState<PageSummary | null>(null)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Extract page ID from URL
    const currentPageId = location.pathname.startsWith('/page/') 
        ? location.pathname.split('/page/')[1]?.split('/')[0] || null
        : null

    const refreshPages = useCallback(async (wsId: string) => {
        const pageSummaries = await listPages(wsId)
        const tree = buildPageTree(pageSummaries)
        setPages(tree)
    }, [])

    // Load current page info when URL changes
    useEffect(() => {
        async function loadCurrentPage() {
            if (currentPageId) {
                const page = await getPage(currentPageId)
                if (page) {
                    setCurrentPage({
                        id: page.id,
                        workspaceId: page.workspaceId,
                        parentPageId: page.parentPageId,
                        title: page.title,
                        type: page.type,
                        isFavorite: page.isFavorite,
                        icon: page.icon,
                        createdAt: page.createdAt,
                        updatedAt: page.updatedAt
                    })
                } else {
                    setCurrentPage(null)
                }
            } else {
                setCurrentPage(null)
            }
        }
        loadCurrentPage()
    }, [currentPageId])

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
        navigate(`/page/${page.id}`)
    }, [navigate])

    const handleCreatePage = useCallback(async (parentPageId?: string) => {
        if (!workspaceId) return

        const newPage = await createPage(workspaceId, 'Untitled', {
            parentPageId: parentPageId ?? null
        })

        await refreshPages(workspaceId)
        navigate(`/page/${newPage.id}`)
    }, [workspaceId, refreshPages, navigate])

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
                selectedPageId={currentPageId}
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
                    currentPage={currentPage}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={toggleSidebar}
                />

                {/* Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
