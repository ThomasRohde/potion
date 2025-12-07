/**
 * Sidebar Component
 * 
 * Left sidebar with page tree navigation, favorites, and workspace controls.
 * Resizable and collapsible.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { 
    FlaskConical, 
    FileText, 
    Database, 
    ChevronsRight, 
    ChevronsLeft, 
    Plus, 
    ChevronDown, 
    ChevronRight,
    Download,
    Upload,
    HelpCircle,
    Settings,
    Star,
    MoreVertical
} from 'lucide-react'
import type { PageSummary, ThemePreference } from '../types'
import type { PageTreeNode } from '../services/pageService'
import { ThemeToggle } from './ThemeToggle'
import { PageIcon } from './PageIcon'

interface SidebarProps {
    pages: PageTreeNode[]
    selectedPageId: string | null
    collapsed: boolean
    width: number
    onWidthChange: (width: number) => void
    onPageSelect: (page: PageSummary) => void
    onCreatePage: (parentPageId?: string) => void
    onCreateDatabase?: (parentPageId?: string) => void
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
    theme?: ThemePreference
    onToggleTheme?: () => void
}

export function Sidebar({
    pages,
    selectedPageId,
    collapsed,
    width,
    onPageSelect,
    onCreatePage,
    onCreateDatabase,
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
    const [showNewMenu, setShowNewMenu] = useState(false)

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
                    <ChevronsRight className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onCreatePage()}
                    className="mt-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    title="New page"
                >
                    <Plus className="w-5 h-5" />
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
                    <FlaskConical className="w-5 h-5 text-potion-600 dark:text-potion-400" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Potion</span>
                </div>
                <button
                    onClick={onToggleCollapse}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                    title="Collapse sidebar"
                >
                    <ChevronsLeft className="w-4 h-4" />
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
                        <Plus className="w-4 h-4" />
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
                {/* New page/database dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowNewMenu(!showNewMenu)}
                        data-testid="new-page-button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New
                        <ChevronDown className="w-3 h-3 ml-auto" />
                    </button>
                    {showNewMenu && (
                        <div
                            className="absolute bottom-full left-0 right-0 z-50 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
                            onMouseLeave={() => setShowNewMenu(false)}
                        >
                            <button
                                onClick={() => {
                                    onCreatePage()
                                    setShowNewMenu(false)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                New page
                            </button>
                            {onCreateDatabase && (
                                <button
                                    onClick={() => {
                                        onCreateDatabase()
                                        setShowNewMenu(false)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Database className="w-4 h-4" />
                                    New database
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={onExportWorkspace}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Export workspace to JSON"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                    <button
                        onClick={onImportWorkspace}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Import workspace from JSON"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Import
                    </button>
                    <button
                        onClick={onShowHelp}
                        className="flex items-center justify-center px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Keyboard shortcuts (?)"
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="flex items-center justify-center px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-3.5 h-3.5" />
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
    const menuRef = useRef<HTMLDivElement>(null)
    const menuButtonRef = useRef<HTMLButtonElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        if (!showMenu) return

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            if (
                menuRef.current && !menuRef.current.contains(target) &&
                menuButtonRef.current && !menuButtonRef.current.contains(target)
            ) {
                setShowMenu(false)
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [showMenu])

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
                onMouseLeave={() => setShowActions(false)}
            >
                {/* Expand/collapse toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleExpand(page.id)
                    }}
                    className={`p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 ${hasChildren ? 'visible' : 'invisible'}`}
                >
                    <ChevronRight
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                </button>

                {/* Icon */}
                <PageIcon type={page.type} icon={page.icon} size="sm" className="shrink-0 text-gray-500 dark:text-gray-400" />

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
                            <Plus className="w-3 h-3" />
                        </button>
                        <button
                            ref={menuButtonRef}
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(!showMenu)
                            }}
                            className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            title="More options"
                        >
                            <MoreVertical className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Dropdown menu */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="absolute right-2 top-full z-50 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
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
                        <Star className="w-4 h-4" fill={page.isFavorite ? "currentColor" : "none"} />
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
                        <Download className="w-4 h-4" />
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
