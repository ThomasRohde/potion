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
import { ConfirmDialog } from './ConfirmDialog'
import { SearchDialog } from './SearchDialog'
import { ImportDialog } from './ImportDialog'
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'
import { SettingsDialog } from './SettingsDialog'
import type { PageSummary } from '../types'
import type { PageTreeNode } from '../services/pageService'
import { useTheme } from '../hooks'
import { getOrCreateDefaultWorkspace, listPages, buildPageTree, createPage, getPage, updatePageTitle, updatePage, deletePage, getChildPages, exportWorkspaceToFile, exportPageToFile, importWorkspaceFromFile, updateWorkspace } from '../services'

interface AppShellProps {
    children?: React.ReactNode
}

interface DeleteConfirmState {
    isOpen: boolean
    pageId: string | null
    pageTitle: string
    hasChildren: boolean
}

interface ImportState {
    isOpen: boolean
    file: File | null
}

export function AppShell({ children }: AppShellProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const { theme, toggleTheme } = useTheme()

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(280)
    const [pages, setPages] = useState<PageTreeNode[]>([])
    const [currentPage, setCurrentPage] = useState<PageSummary | null>(null)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [workspaceName, setWorkspaceName] = useState('Potion')
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
        isOpen: false,
        pageId: null,
        pageTitle: '',
        hasChildren: false
    })
    const [importState, setImportState] = useState<ImportState>({
        isOpen: false,
        file: null
    })

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
                setWorkspaceName(workspace.name)
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

    // Global keyboard shortcuts - must be after handleCreatePage
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ctrl/Cmd+K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchOpen(true)
            }
            // Ctrl/Cmd+N to create new page
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault()
                handleCreatePage()
            }
            // ? to open keyboard shortcuts help
            if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const target = e.target as HTMLElement
                // Only show if not in an input field
                if (!['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
                    e.preventDefault()
                    setIsShortcutsOpen(true)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleCreatePage])

    const handleRenamePage = useCallback(async (pageId: string, newTitle: string) => {
        if (!workspaceId) return

        try {
            await updatePageTitle(pageId, newTitle)
            await refreshPages(workspaceId)

            // If current page was renamed, update the current page state
            if (currentPageId === pageId) {
                const updatedPage = await getPage(pageId)
                if (updatedPage) {
                    setCurrentPage({
                        id: updatedPage.id,
                        workspaceId: updatedPage.workspaceId,
                        parentPageId: updatedPage.parentPageId,
                        title: updatedPage.title,
                        type: updatedPage.type,
                        isFavorite: updatedPage.isFavorite,
                        icon: updatedPage.icon,
                        createdAt: updatedPage.createdAt,
                        updatedAt: updatedPage.updatedAt
                    })
                }
            }
        } catch (error) {
            console.error('Failed to rename page:', error)
        }
    }, [workspaceId, refreshPages, currentPageId])

    const handleDeletePage = useCallback(async (pageId: string, hasChildren: boolean) => {
        // Find the page to get its title
        const findPage = (nodes: PageTreeNode[]): PageTreeNode | null => {
            for (const node of nodes) {
                if (node.id === pageId) return node
                if (node.children) {
                    const found = findPage(node.children)
                    if (found) return found
                }
            }
            return null
        }

        const pageToDelete = findPage(pages)
        const pageTitle = pageToDelete?.title || 'Untitled'

        setDeleteConfirm({
            isOpen: true,
            pageId,
            pageTitle,
            hasChildren
        })
    }, [pages])

    const handleToggleFavorite = useCallback(async (pageId: string, isFavorite: boolean) => {
        if (!workspaceId) return

        try {
            await updatePage(pageId, { isFavorite })
            await refreshPages(workspaceId)

            // If current page was toggled, update the current page state
            if (currentPageId === pageId) {
                const updatedPage = await getPage(pageId)
                if (updatedPage) {
                    setCurrentPage({
                        id: updatedPage.id,
                        workspaceId: updatedPage.workspaceId,
                        parentPageId: updatedPage.parentPageId,
                        title: updatedPage.title,
                        type: updatedPage.type,
                        isFavorite: updatedPage.isFavorite,
                        icon: updatedPage.icon,
                        createdAt: updatedPage.createdAt,
                        updatedAt: updatedPage.updatedAt
                    })
                }
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error)
        }
    }, [workspaceId, refreshPages, currentPageId])

    const handleMovePage = useCallback(async (pageId: string, newParentId: string | null) => {
        if (!workspaceId) return

        try {
            // Don't allow moving a page to itself
            if (pageId === newParentId) return

            // Check if we're trying to move a page to one of its own descendants
            const isDescendant = (parentId: string | null, targetId: string): boolean => {
                if (!parentId) return false
                if (parentId === targetId) return true
                const findNode = (nodes: typeof pages): typeof pages[0] | undefined => {
                    for (const n of nodes) {
                        if (n.id === parentId) return n
                        if (n.children) {
                            const found = findNode(n.children)
                            if (found) return found
                        }
                    }
                    return undefined
                }
                const parentNode = findNode(pages)
                return parentNode ? isDescendant(parentNode.parentPageId, targetId) : false
            }

            if (newParentId && isDescendant(newParentId, pageId)) {
                console.warn('Cannot move a page to one of its descendants')
                return
            }

            await updatePage(pageId, { parentPageId: newParentId })
            await refreshPages(workspaceId)
        } catch (error) {
            console.error('Failed to move page:', error)
        }
    }, [workspaceId, refreshPages, pages])

    const confirmDelete = useCallback(async () => {
        if (!workspaceId || !deleteConfirm.pageId) return

        try {
            // If page has children, first orphan them (move to root)
            if (deleteConfirm.hasChildren) {
                const children = await getChildPages(deleteConfirm.pageId)
                for (const child of children) {
                    await updatePage(child.id, { parentPageId: null })
                }
            }

            await deletePage(deleteConfirm.pageId)
            await refreshPages(workspaceId)

            // If we deleted the current page, navigate to home
            if (currentPageId === deleteConfirm.pageId) {
                navigate('/')
            }
        } catch (error) {
            console.error('Failed to delete page:', error)
        } finally {
            setDeleteConfirm({ isOpen: false, pageId: null, pageTitle: '', hasChildren: false })
        }
    }, [workspaceId, deleteConfirm, refreshPages, currentPageId, navigate])

    const cancelDelete = useCallback(() => {
        setDeleteConfirm({ isOpen: false, pageId: null, pageTitle: '', hasChildren: false })
    }, [])

    const handleExportWorkspace = useCallback(async () => {
        try {
            await exportWorkspaceToFile()
        } catch (error) {
            console.error('Failed to export workspace:', error)
            // Could show a toast/notification here
        }
    }, [])

    const handleExportPage = useCallback(async (pageId: string, includeChildren: boolean) => {
        try {
            await exportPageToFile(pageId, includeChildren)
        } catch (error) {
            console.error('Failed to export page:', error)
            // Could show a toast/notification here
        }
    }, [])

    const handleImportWorkspace = useCallback(async () => {
        // Create a hidden file input and trigger it
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            // Open the import dialog with the file
            setImportState({ isOpen: true, file })
        }

        input.click()
    }, [])

    const confirmImport = useCallback(async () => {
        if (!importState.file) return

        try {
            const result = await importWorkspaceFromFile(importState.file, 'replace')
            if (result.success) {
                // Refresh the pages after import
                if (workspaceId) {
                    await refreshPages(workspaceId)
                }
                // Navigate to home after import
                navigate('/')
            } else {
                console.error('Import failed:', result.errors)
            }
        } catch (error) {
            console.error('Failed to import workspace:', error)
        } finally {
            setImportState({ isOpen: false, file: null })
        }
    }, [importState.file, workspaceId, refreshPages, navigate])

    const cancelImport = useCallback(() => {
        setImportState({ isOpen: false, file: null })
    }, [])

    const handleWorkspaceNameChange = useCallback(async (newName: string) => {
        if (!workspaceId) return
        
        try {
            await updateWorkspace(workspaceId, { name: newName })
            setWorkspaceName(newName)
        } catch (error) {
            console.error('Failed to update workspace name:', error)
        }
    }, [workspaceId])

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
                onRenamePage={handleRenamePage}
                onDeletePage={handleDeletePage}
                onToggleFavorite={handleToggleFavorite}
                onMovePage={handleMovePage}
                onExportPage={handleExportPage}
                onToggleCollapse={toggleSidebar}
                onExportWorkspace={handleExportWorkspace}
                onImportWorkspace={handleImportWorkspace}
                onShowHelp={() => setIsShortcutsOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                theme={theme}
                onToggleTheme={toggleTheme}
            />

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <Topbar
                    currentPage={currentPage}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={toggleSidebar}
                    onOpenSearch={() => setIsSearchOpen(true)}
                />

                {/* Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Page"
                message={
                    deleteConfirm.hasChildren
                        ? `Are you sure you want to delete "${deleteConfirm.pageTitle}"? Child pages will be moved to the root level.`
                        : `Are you sure you want to delete "${deleteConfirm.pageTitle}"? This action cannot be undone.`
                }
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />

            {/* Search Dialog */}
            {workspaceId && (
                <SearchDialog
                    isOpen={isSearchOpen}
                    workspaceId={workspaceId}
                    onClose={() => setIsSearchOpen(false)}
                    onSelectPage={(pageId) => navigate(`/page/${pageId}`)}
                />
            )}

            {/* Import Dialog */}
            <ImportDialog
                isOpen={importState.isOpen}
                file={importState.file}
                onConfirm={confirmImport}
                onCancel={cancelImport}
            />

            {/* Keyboard Shortcuts Dialog */}
            <KeyboardShortcutsDialog
                isOpen={isShortcutsOpen}
                onClose={() => setIsShortcutsOpen(false)}
            />

            {/* Settings Dialog */}
            <SettingsDialog
                isOpen={isSettingsOpen}
                workspaceName={workspaceName}
                onClose={() => setIsSettingsOpen(false)}
                onWorkspaceNameChange={handleWorkspaceNameChange}
            />
        </div>
    )
}
