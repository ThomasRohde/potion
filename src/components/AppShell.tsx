/**
 * Main App Shell Layout
 * 
 * Core layout component with sidebar, topbar, and content area.
 * Responsive design with collapsible sidebar.
 * 
 * State managed by zustand stores:
 * - WorkspaceStore: workspace data, pages, current page
 * - UIStore: sidebar, dialogs, modals
 * - ThemeStore: light/dark/system theme
 */

import React, { useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ConfirmDialog } from './ConfirmDialog'
import { SearchDialog } from './SearchDialog'
import { ImportDialog, ImportResultDialog } from './ImportDialog'
import type { ImportMode, ImportResultData } from './ImportDialog'
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'
import { SettingsDialog } from './SettingsDialog'
import type { PageSummary } from '../types'
import { useWorkspaceStore, useUIStore, useThemeStore } from '../stores'
import { getOrCreateDefaultWorkspace, listPages, createPage, updatePageTitle, updatePage, deletePage, getChildPages, exportWorkspaceToFile, exportPageToFile, importWorkspaceFromFile, updateWorkspace, createDatabase } from '../services'

interface AppShellProps {
    children?: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const navigate = useNavigate()
    const location = useLocation()

    // Workspace store
    const workspaceId = useWorkspaceStore(state => state.workspaceId)
    const workspaceName = useWorkspaceStore(state => state.workspaceName)
    const pages = useWorkspaceStore(state => state.pageTree)
    const flatPages = useWorkspaceStore(state => state.pages)
    const currentPageId = useWorkspaceStore(state => state.currentPageId)
    const isLoading = useWorkspaceStore(state => state.isLoading)
    const setWorkspace = useWorkspaceStore(state => state.setWorkspace)
    const setWorkspaceName = useWorkspaceStore(state => state.setWorkspaceName)
    const setPages = useWorkspaceStore(state => state.setPages)
    const refreshPages = useWorkspaceStore(state => state.refreshPages)
    const setCurrentPageId = useWorkspaceStore(state => state.setCurrentPageId)
    const setLoading = useWorkspaceStore(state => state.setLoading)

    // UI store
    const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed)
    const sidebarWidth = useUIStore(state => state.sidebarWidth)
    const isSearchOpen = useUIStore(state => state.isSearchOpen)
    const isShortcutsOpen = useUIStore(state => state.isShortcutsOpen)
    const isSettingsOpen = useUIStore(state => state.isSettingsOpen)
    const deleteConfirm = useUIStore(state => state.deleteConfirm)
    const importState = useUIStore(state => state.importState)
    const toggleSidebar = useUIStore(state => state.toggleSidebar)
    const setSidebarWidth = useUIStore(state => state.setSidebarWidth)
    const openSearch = useUIStore(state => state.openSearch)
    const closeSearch = useUIStore(state => state.closeSearch)
    const openShortcuts = useUIStore(state => state.openShortcuts)
    const closeShortcuts = useUIStore(state => state.closeShortcuts)
    const openSettings = useUIStore(state => state.openSettings)
    const closeSettings = useUIStore(state => state.closeSettings)
    const openDeleteConfirm = useUIStore(state => state.openDeleteConfirm)
    const closeDeleteConfirm = useUIStore(state => state.closeDeleteConfirm)
    const openImport = useUIStore(state => state.openImport)
    const closeImport = useUIStore(state => state.closeImport)

    // Theme store
    const theme = useThemeStore(state => state.preference)
    const toggleTheme = useThemeStore(state => state.toggleTheme)

    // Import result state (kept local as it's transient)
    const [importResult, setImportResult] = React.useState<{ isOpen: boolean; result: ImportResultData | null }>({
        isOpen: false,
        result: null
    })

    // Get current page from flat pages list
    const currentPage = flatPages.find(p => p.id === currentPageId) || null

    // Extract page ID from URL
    const urlPageId = location.pathname.startsWith('/page/')
        ? location.pathname.split('/page/')[1]?.split('/')[0] || null
        : null

    // Sync URL page ID with store
    useEffect(() => {
        if (urlPageId !== currentPageId) {
            setCurrentPageId(urlPageId)
        }
    }, [urlPageId, currentPageId, setCurrentPageId])

    const refreshPagesFromStorage = useCallback(async (wsId: string) => {
        const pageSummaries = await listPages(wsId)
        refreshPages(pageSummaries)
    }, [refreshPages])

    // Initialize workspace and load pages
    useEffect(() => {
        async function init() {
            try {
                const workspace = await getOrCreateDefaultWorkspace()
                setWorkspace(workspace.id, workspace.name)
                const pageSummaries = await listPages(workspace.id)
                setPages(pageSummaries)
            } catch (error) {
                console.error('Failed to initialize workspace:', error)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [setWorkspace, setPages, setLoading])

    const handlePageSelect = useCallback((page: PageSummary) => {
        navigate(`/page/${page.id}`)
    }, [navigate])

    const handleCreatePage = useCallback(async (parentPageId?: string) => {
        if (!workspaceId) return

        const newPage = await createPage(workspaceId, 'Untitled', {
            parentPageId: parentPageId ?? null
        })

        await refreshPagesFromStorage(workspaceId)
        navigate(`/page/${newPage.id}`)
    }, [workspaceId, refreshPagesFromStorage, navigate])

    const handleCreateDatabase = useCallback(async (parentPageId?: string) => {
        if (!workspaceId) return

        const { page } = await createDatabase(workspaceId, 'Untitled Database', {
            parentPageId: parentPageId ?? null
        })

        await refreshPagesFromStorage(workspaceId)
        navigate(`/page/${page.id}`)
    }, [workspaceId, refreshPagesFromStorage, navigate])

    // Global keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ctrl/Cmd+K to open search
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                openSearch()
                return
            }
            // Ctrl/Cmd+N to create new page
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault()
                handleCreatePage()
                return
            }
            // ? to open keyboard shortcuts help
            if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const target = e.target as HTMLElement
                // Only show if not in an input field
                if (!['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
                    e.preventDefault()
                    openShortcuts()
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown, true)
        return () => window.removeEventListener('keydown', handleKeyDown, true)
    }, [handleCreatePage, openSearch, openShortcuts])

    const handleRenamePage = useCallback(async (pageId: string, newTitle: string) => {
        if (!workspaceId) return

        try {
            await updatePageTitle(pageId, newTitle)
            await refreshPagesFromStorage(workspaceId)
        } catch (error) {
            console.error('Failed to rename page:', error)
        }
    }, [workspaceId, refreshPagesFromStorage])

    const handleDeletePage = useCallback(async (pageId: string, _hasChildren: boolean) => {
        // Find the page to get its title
        const pageToDelete = flatPages.find(p => p.id === pageId)
        const pageTitle = pageToDelete?.title || 'Untitled'
        openDeleteConfirm(pageId, pageTitle)
    }, [flatPages, openDeleteConfirm])

    const handleToggleFavorite = useCallback(async (pageId: string, isFavorite: boolean) => {
        if (!workspaceId) return

        try {
            await updatePage(pageId, { isFavorite })
            await refreshPagesFromStorage(workspaceId)
        } catch (error) {
            console.error('Failed to toggle favorite:', error)
        }
    }, [workspaceId, refreshPagesFromStorage])

    const handleToggleFullWidth = useCallback(async (pageId: string, isFullWidth: boolean) => {
        if (!workspaceId) return

        try {
            await updatePage(pageId, { isFullWidth })
            await refreshPagesFromStorage(workspaceId)
        } catch (error) {
            console.error('Failed to toggle full width:', error)
        }
    }, [workspaceId, refreshPagesFromStorage])

    const handleMovePage = useCallback(async (pageId: string, newParentId: string | null) => {
        if (!workspaceId) return

        try {
            // Don't allow moving a page to itself
            if (pageId === newParentId) return

            // Check if we're trying to move a page to one of its own descendants
            const isDescendant = (parentId: string | null, targetId: string): boolean => {
                if (!parentId) return false
                if (parentId === targetId) return true
                const parentNode = flatPages.find(p => p.id === parentId)
                return parentNode ? isDescendant(parentNode.parentPageId, targetId) : false
            }

            if (newParentId && isDescendant(newParentId, pageId)) {
                console.warn('Cannot move a page to one of its descendants')
                return
            }

            await updatePage(pageId, { parentPageId: newParentId })
            await refreshPagesFromStorage(workspaceId)
        } catch (error) {
            console.error('Failed to move page:', error)
        }
    }, [workspaceId, refreshPagesFromStorage, flatPages])

    const confirmDelete = useCallback(async () => {
        if (!workspaceId || !deleteConfirm.pageId) return

        try {
            // Check if page has children
            const children = await getChildPages(deleteConfirm.pageId)
            const hasChildren = children.length > 0

            // If page has children, first orphan them (move to root)
            if (hasChildren) {
                for (const child of children) {
                    await updatePage(child.id, { parentPageId: null })
                }
            }

            await deletePage(deleteConfirm.pageId)
            await refreshPagesFromStorage(workspaceId)

            // If we deleted the current page, navigate to home
            if (currentPageId === deleteConfirm.pageId) {
                navigate('/')
            }
        } catch (error) {
            console.error('Failed to delete page:', error)
        } finally {
            closeDeleteConfirm()
        }
    }, [workspaceId, deleteConfirm.pageId, refreshPagesFromStorage, currentPageId, navigate, closeDeleteConfirm])

    const handleExportWorkspace = useCallback(async () => {
        try {
            await exportWorkspaceToFile()
        } catch (error) {
            console.error('Failed to export workspace:', error)
        }
    }, [])

    const handleExportPage = useCallback(async (pageId: string, includeChildren: boolean) => {
        try {
            await exportPageToFile(pageId, includeChildren)
        } catch (error) {
            console.error('Failed to export page:', error)
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

            // Read and parse file to open import dialog
            try {
                const text = await file.text()
                const data = JSON.parse(text)
                openImport(data)
            } catch (error) {
                console.error('Failed to parse import file:', error)
            }
        }

        input.click()
    }, [openImport])

    const confirmImport = useCallback(async (mode: ImportMode) => {
        if (!importState.data) return

        try {
            // Create a file-like object from the data
            const blob = new Blob([JSON.stringify(importState.data)], { type: 'application/json' })
            const file = new File([blob], 'import.json', { type: 'application/json' })

            const result = await importWorkspaceFromFile(file, mode)

            // Close the import dialog
            closeImport()

            // Show the result dialog
            setImportResult({
                isOpen: true,
                result: {
                    success: result.success,
                    pagesAdded: result.pagesAdded,
                    pagesUpdated: result.pagesUpdated,
                    conflicts: result.conflicts || [],
                    errors: result.errors
                }
            })

            if (result.success && workspaceId) {
                // Refresh the pages after import
                await refreshPagesFromStorage(workspaceId)
                // Navigate to home after import
                navigate('/')
            }
        } catch (error) {
            console.error('Failed to import workspace:', error)
            closeImport()
            setImportResult({
                isOpen: true,
                result: {
                    success: false,
                    pagesAdded: 0,
                    pagesUpdated: 0,
                    conflicts: [],
                    errors: [error instanceof Error ? error.message : 'Import failed']
                }
            })
        }
    }, [importState.data, workspaceId, refreshPagesFromStorage, navigate, closeImport])

    const handleWorkspaceNameChange = useCallback(async (newName: string) => {
        if (!workspaceId) return

        try {
            await updateWorkspace(workspaceId, { name: newName })
            setWorkspaceName(newName)
        } catch (error) {
            console.error('Failed to update workspace name:', error)
        }
    }, [workspaceId, setWorkspaceName])

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
                onCreateDatabase={handleCreateDatabase}
                onRenamePage={handleRenamePage}
                onDeletePage={handleDeletePage}
                onToggleFavorite={handleToggleFavorite}
                onMovePage={handleMovePage}
                onExportPage={handleExportPage}
                onToggleCollapse={toggleSidebar}
                onExportWorkspace={handleExportWorkspace}
                onImportWorkspace={handleImportWorkspace}
                onShowHelp={openShortcuts}
                onOpenSettings={openSettings}
                theme={theme}
                onToggleTheme={toggleTheme}
            />

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <Topbar
                    currentPage={currentPage}
                    isFullWidth={currentPage?.isFullWidth ?? false}
                    onOpenSearch={openSearch}
                    onRenameTitle={currentPage ? (newTitle) => handleRenamePage(currentPage.id, newTitle) : undefined}
                    onToggleFavorite={currentPage ? () => handleToggleFavorite(currentPage.id, !currentPage.isFavorite) : undefined}
                    onToggleFullWidth={currentPage ? () => handleToggleFullWidth(currentPage.id, !currentPage.isFullWidth) : undefined}
                    onExportPage={currentPage ? () => handleExportPage(currentPage.id, true) : undefined}
                    onDeletePage={currentPage ? () => handleDeletePage(currentPage.id, false) : undefined}
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
                message={`Are you sure you want to delete "${deleteConfirm.pageTitle}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={closeDeleteConfirm}
            />

            {/* Search Dialog */}
            {workspaceId && (
                <SearchDialog
                    isOpen={isSearchOpen}
                    workspaceId={workspaceId}
                    onClose={closeSearch}
                    onSelectPage={(pageId) => navigate(`/page/${pageId}`)}
                />
            )}

            {/* Import Dialog */}
            <ImportDialog
                isOpen={importState.isOpen}
                file={null}
                data={importState.data}
                onConfirm={confirmImport}
                onCancel={closeImport}
            />

            {/* Import Result Dialog */}
            <ImportResultDialog
                isOpen={importResult.isOpen}
                result={importResult.result}
                onClose={() => setImportResult({ isOpen: false, result: null })}
            />

            {/* Keyboard Shortcuts Dialog */}
            <KeyboardShortcutsDialog
                isOpen={isShortcutsOpen}
                onClose={closeShortcuts}
            />

            {/* Settings Dialog */}
            <SettingsDialog
                isOpen={isSettingsOpen}
                workspaceName={workspaceName}
                onClose={closeSettings}
                onWorkspaceNameChange={handleWorkspaceNameChange}
            />
        </div>
    )
}
