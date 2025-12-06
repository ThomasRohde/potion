/**
 * Sidebar Component
 * 
 * Left sidebar with page tree navigation, favorites, and workspace controls.
 * Resizable and collapsible.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { PageSummary } from '../types'
import type { PageTreeNode } from '../services/pageService'
import type { Theme } from '../hooks'
import { ThemeToggle } from './ThemeToggle'

interface SidebarProps {
    pages: PageTreeNode[]
    selectedPageId: string | null
    collapsed: boolean
    width: number
    onWidthChange: (width: number) => void
    onPageSelect: (page: PageSummary) => void
    onCreatePage: (parentPageId?: string) => void
    onRenamePage?: (pageId: string, newTitle: string) => void
    onDeletePage?: (pageId: string, hasChildren: boolean) => void
    onToggleFavorite?: (pageId: string, isFavorite: boolean) => void
    onMovePage?: (pageId: string, newParentId: string | null) => void
    onExportPage?: (pageId: string, includeChildren: boolean) => void
    onToggleCollapse: () => void
    onExportWorkspace?: () => void
    onImportWorkspace?: () => void
    onShowHelp?: () => void
    onOpenSettings?: () => void
    theme?: Theme
    onToggleTheme?: () => void
}

export function Sidebar({
    pages,
    selectedPageId,
    collapsed,
    width,
    onPageSelect,
    onCreatePage,
    onRenamePage,
    onDeletePage,
    onToggleFavorite,
    onMovePage,
    onExportPage,
    onToggleCollapse,
    onExportWorkspace,
    onImportWorkspace,
    onShowHelp,
    onOpenSettings,
    theme,
    onToggleTheme
}: SidebarProps) {
    const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())
    const [dragOverPageId, setDragOverPageId] = useState<string | null>(null)
    const [dragOverRoot, setDragOverRoot] = useState(false)

    const toggleExpanded = useCallback((pageId: string) => {
        setExpandedPages(prev => {
            const next = new Set(prev)
            if (next.has(pageId)) {
                next.delete(pageId)
            } else {
                next.add(pageId)
            }
            return next
        })
    }, [])

    const favoritePages = pages.filter(p => p.isFavorite)

    if (collapsed) {
        return (
            <div className="w-12 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
                <button
                    onClick={onToggleCollapse}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    title="Expand sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
                <button
                    onClick={() => onCreatePage()}
                    className="mt-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    title="New page"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        )
    }

    return (
        <div
            data-testid="sidebar"
            className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
            style={{ width: `${width}px`, minWidth: '200px', maxWidth: '400px' }}
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🧪</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Potion</span>
                </div>
                <button
                    onClick={onToggleCollapse}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                    title="Collapse sidebar"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Favorites section */}
            {favoritePages.length > 0 && (
                <div className="px-2 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Favorites
                    </h3>
                    {favoritePages.map(page => (
                        <PageItem
                            key={page.id}
                            page={page}
                            depth={0}
                            isSelected={selectedPageId === page.id}
                            isExpanded={expandedPages.has(page.id)}
                            isDragOver={dragOverPageId === page.id}
                            onSelect={onPageSelect}
                            onToggleExpand={toggleExpanded}
                            onCreateChild={onCreatePage}
                            onRename={onRenamePage}
                            onDelete={onDeletePage}
                            onToggleFavorite={onToggleFavorite}
                            onMovePage={onMovePage}
                            onExportPage={onExportPage}
                            onDragOverChange={setDragOverPageId}
                        />
                    ))}
                </div>
            )}

            {/* Pages section */}
            <div
                className={`flex-1 overflow-y-auto px-2 py-3 ${dragOverRoot ? 'bg-potion-50 dark:bg-potion-900/20' : ''}`}
                onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverRoot(true)
                }}
                onDragLeave={(e) => {
                    // Only set to false if we're leaving the container, not entering a child
                    const related = e.relatedTarget as Element | null
                    if (!related || !e.currentTarget.contains(related)) {
                        setDragOverRoot(false)
                    }
                }}
                onDrop={(e) => {
                    e.preventDefault()
                    setDragOverRoot(false)
                    const pageId = e.dataTransfer.getData('text/plain')
                    if (pageId && onMovePage) {
                        onMovePage(pageId, null) // Move to root
                    }
                }}
            >
                <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pages
                    </h3>
                    <button
                        onClick={() => onCreatePage()}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                        title="New page"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
                {pages.length === 0 ? (
                    <p className="px-2 text-sm text-gray-400 dark:text-gray-500">
                        No pages yet
                    </p>
                ) : (
                    pages.map(page => (
                        <PageItem
                            key={page.id}
                            page={page}
                            depth={0}
                            isSelected={selectedPageId === page.id}
                            isExpanded={expandedPages.has(page.id)}
                            isDragOver={dragOverPageId === page.id}
                            onSelect={onPageSelect}
                            onToggleExpand={toggleExpanded}
                            onCreateChild={onCreatePage}
                            onRename={onRenamePage}
                            onDelete={onDeletePage}
                            onToggleFavorite={onToggleFavorite}
                            onMovePage={onMovePage}
                            onExportPage={onExportPage}
                            onDragOverChange={setDragOverPageId}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <button
                    onClick={() => onCreatePage()}
                    data-testid="new-page-button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New page
                </button>
                <div className="flex gap-1">
                    <button
                        onClick={onExportWorkspace}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Export workspace to JSON"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                    <button
                        onClick={onImportWorkspace}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Import workspace from JSON"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import
                    </button>
                    <button
                        onClick={onShowHelp}
                        className="flex items-center justify-center px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Keyboard shortcuts (?)"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="flex items-center justify-center px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Settings"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    {theme && onToggleTheme && (
                        <ThemeToggle
                            theme={theme}
                            onToggle={onToggleTheme}
                            className="px-2 py-1.5"
                            data-testid="theme-toggle"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

interface PageItemProps {
    page: PageTreeNode
    depth: number
    isSelected: boolean
    isExpanded: boolean
    isDragOver: boolean
    onSelect: (page: PageSummary) => void
    onToggleExpand: (pageId: string) => void
    onCreateChild: (parentPageId: string) => void
    onRename?: (pageId: string, newTitle: string) => void
    onDelete?: (pageId: string, hasChildren: boolean) => void
    onToggleFavorite?: (pageId: string, isFavorite: boolean) => void
    onMovePage?: (pageId: string, newParentId: string | null) => void
    onExportPage?: (pageId: string, includeChildren: boolean) => void
    onDragOverChange: (pageId: string | null) => void
}

function PageItem({
    page,
    depth,
    isSelected,
    isExpanded,
    isDragOver,
    onSelect,
    onToggleExpand,
    onCreateChild,
    onRename,
    onDelete,
    onToggleFavorite,
    onMovePage,
    onExportPage,
    onDragOverChange
}: PageItemProps) {
    const hasChildren = page.children && page.children.length > 0
    const [showActions, setShowActions] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(page.title)
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleRenameSubmit = () => {
        if (onRename && editTitle.trim() !== page.title) {
            onRename(page.id, editTitle.trim() || 'Untitled')
        }
        setIsEditing(false)
    }

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRenameSubmit()
        } else if (e.key === 'Escape') {
            setEditTitle(page.title)
            setIsEditing(false)
        }
    }

    const handleDelete = () => {
        if (onDelete) {
            onDelete(page.id, hasChildren)
        }
        setShowMenu(false)
    }

    const startRename = () => {
        setEditTitle(page.title)
        setIsEditing(true)
        setShowMenu(false)
    }

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', page.id)
        e.dataTransfer.effectAllowed = 'move'
        setIsDragging(true)
    }

    const handleDragEnd = () => {
        setIsDragging(false)
        onDragOverChange(null)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const draggedPageId = e.dataTransfer.types.includes('text/plain')
        if (draggedPageId) {
            e.dataTransfer.dropEffect = 'move'
            onDragOverChange(page.id)
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // Only clear if leaving this element, not entering a child
        const related = e.relatedTarget as Element | null
        if (!related || !e.currentTarget.contains(related)) {
            onDragOverChange(null)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onDragOverChange(null)
        const draggedPageId = e.dataTransfer.getData('text/plain')
        // Don't allow dropping onto itself or its own children
        if (draggedPageId && draggedPageId !== page.id && onMovePage) {
            onMovePage(draggedPageId, page.id)
        }
    }

    return (
        <div className="relative">
            <div
                className={`
                    group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all
                    ${isDragging ? 'opacity-50' : ''}
                    ${isDragOver ? 'ring-2 ring-potion-500 bg-potion-50 dark:bg-potion-900/30' : ''}
                    ${isSelected
                        ? 'bg-potion-100 dark:bg-potion-900/30 text-potion-700 dark:text-potion-300'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                `}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
                draggable={!isEditing}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isEditing && onSelect(page)}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => { setShowActions(false); setShowMenu(false) }}
            >
                {/* Expand/collapse toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleExpand(page.id)
                    }}
                    className={`p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 ${hasChildren ? 'visible' : 'invisible'}`}
                >
                    <svg
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Icon */}
                <span className="text-sm shrink-0">
                    {page.icon ?? (page.type === 'database' ? '📊' : '📄')}
                </span>

                {/* Title - editable or static */}
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleRenameKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm flex-1 bg-white dark:bg-gray-700 border border-potion-500 rounded px-1 py-0.5 outline-none"
                    />
                ) : (
                    <span className="text-sm truncate flex-1">
                        {page.title || 'Untitled'}
                    </span>
                )}

                {/* Actions */}
                {showActions && !isEditing && (
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onCreateChild(page.id)
                            }}
                            className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            title="Add child page"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(!showMenu)
                            }}
                            className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            title="More options"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Dropdown menu */}
            {showMenu && (
                <div
                    className="absolute right-2 top-full z-50 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
                    onMouseLeave={() => setShowMenu(false)}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (onToggleFavorite) {
                                onToggleFavorite(page.id, !page.isFavorite)
                            }
                            setShowMenu(false)
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill={page.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {page.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            startRename()
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Rename
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (onExportPage) {
                                onExportPage(page.id, true)
                            }
                            setShowMenu(false)
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDelete()
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Delete
                    </button>
                </div>
            )}

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {page.children.map(child => (
                        <PageItem
                            key={child.id}
                            page={child}
                            depth={depth + 1}
                            isSelected={isSelected}
                            isExpanded={false}
                            isDragOver={false}
                            onSelect={onSelect}
                            onToggleExpand={onToggleExpand}
                            onCreateChild={onCreateChild}
                            onRename={onRename}
                            onDelete={onDelete}
                            onToggleFavorite={onToggleFavorite}
                            onMovePage={onMovePage}
                            onExportPage={onExportPage}
                            onDragOverChange={onDragOverChange}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
