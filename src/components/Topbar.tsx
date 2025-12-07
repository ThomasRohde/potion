/**
 * Topbar Component
 * 
 * Top navigation bar showing current page title and actions.
 */

import React, { useState, useRef, useEffect } from 'react'
import { 
    Search, 
    Star, 
    MoreVertical, 
    Copy, 
    Maximize2, 
    Minimize2, 
    Check, 
    Download, 
    FileText, 
    Code, 
    Trash2 
} from 'lucide-react'
import type { PageSummary } from '../types'

interface TopbarProps {
    currentPage: PageSummary | null
    isFullWidth?: boolean
    onOpenSearch?: () => void
    onRenameTitle?: (newTitle: string) => void
    onToggleFavorite?: () => void
    onToggleFullWidth?: () => void
    onDuplicatePage?: () => void
    onExportPage?: () => void
    onExportMarkdown?: () => void
    onExportHtml?: () => void
    onDeletePage?: () => void
}

export function Topbar({
    currentPage,
    isFullWidth = false,
    onOpenSearch,
    onRenameTitle,
    onToggleFavorite,
    onToggleFullWidth,
    onDuplicatePage,
    onExportPage,
    onExportMarkdown,
    onExportHtml,
    onDeletePage
}: TopbarProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState('')
    const [showMenu, setShowMenu] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const menuButtonRef = useRef<HTMLButtonElement>(null)

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    // Reset edit title when page changes
    useEffect(() => {
        if (currentPage) {
            setEditTitle(currentPage.title || 'Untitled')
        }
    }, [currentPage])

    const handleTitleClick = () => {
        if (currentPage && onRenameTitle) {
            setEditTitle(currentPage.title || 'Untitled')
            setIsEditing(true)
        }
    }

    const handleTitleSubmit = () => {
        if (onRenameTitle && editTitle.trim()) {
            onRenameTitle(editTitle.trim())
        }
        setIsEditing(false)
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSubmit()
        } else if (e.key === 'Escape') {
            setEditTitle(currentPage?.title || 'Untitled')
            setIsEditing(false)
        }
    }

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

    return (
        <header className="h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center px-4 gap-2">
            {/* Breadcrumb / Page title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {currentPage ? (
                    <>
                        {currentPage.icon && (
                            <span className="text-lg">{currentPage.icon}</span>
                        )}
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleTitleSubmit}
                                onKeyDown={handleTitleKeyDown}
                                className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-potion-500 rounded px-2 py-0.5 outline-none flex-1 min-w-0"
                            />
                        ) : (
                            <h1
                                onClick={handleTitleClick}
                                className={`text-sm font-medium text-gray-700 dark:text-gray-300 truncate ${onRenameTitle ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-0.5 -mx-2 rounded' : ''}`}
                                title={onRenameTitle ? 'Click to edit title' : undefined}
                            >
                                {currentPage.title || 'Untitled'}
                            </h1>
                        )}
                        {currentPage.type === 'database' && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                                Database
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                        No page selected
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {/* Search button */}
                {onOpenSearch && (
                    <button
                        onClick={onOpenSearch}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                        title="Search (Ctrl+K)"
                    >
                        <Search className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">Search</span>
                        <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">⌘K</kbd>
                    </button>
                )}
                {/* Favorite toggle */}
                {currentPage && (
                    <button
                        onClick={onToggleFavorite}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${currentPage.isFavorite
                            ? 'text-yellow-500'
                            : 'text-gray-400 dark:text-gray-500'
                            }`}
                        title={currentPage.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Star
                            className="w-5 h-5"
                            fill={currentPage.isFavorite ? 'currentColor' : 'none'}
                        />
                    </button>
                )}

                {/* More actions */}
                {currentPage && (
                    <div className="relative">
                        <button
                            ref={menuButtonRef}
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500"
                            title="More options"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {showMenu && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-full z-50 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
                            >
                                {onDuplicatePage && (
                                    <button
                                        onClick={() => {
                                            onDuplicatePage()
                                            setShowMenu(false)
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Duplicate
                                    </button>
                                )}
                                {onToggleFullWidth && (
                                    <button
                                        onClick={() => {
                                            onToggleFullWidth()
                                            setShowMenu(false)
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        {isFullWidth ? (
                                            <Minimize2 className="w-4 h-4" />
                                        ) : (
                                            <Maximize2 className="w-4 h-4" />
                                        )}
                                        <span className="flex-1">Full width</span>
                                        {isFullWidth && (
                                            <Check className="w-4 h-4 text-potion-500" />
                                        )}
                                    </button>
                                )}
                                {onExportPage && (
                                    <button
                                        onClick={() => {
                                            onExportPage()
                                            setShowMenu(false)
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export JSON
                                    </button>
                                )}
                                {onExportMarkdown && (
                                    <button
                                        onClick={() => {
                                            onExportMarkdown()
                                            setShowMenu(false)
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Export Markdown
                                    </button>
                                )}
                                {onExportHtml && (
                                    <button
                                        onClick={() => {
                                            onExportHtml()
                                            setShowMenu(false)
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <Code className="w-4 h-4" />
                                        Export HTML
                                    </button>
                                )}
                                {onDeletePage && (
                                    <>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                        <button
                                            onClick={() => {
                                                onDeletePage()
                                                setShowMenu(false)
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}
