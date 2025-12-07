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
import { Button } from '@/components/ui/button'

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
                    <Button
                        variant="ghost"
                        onClick={onOpenSearch}
                        className="gap-2"
                        title="Search (Ctrl+K)"
                    >
                        <Search className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">Search</span>
                        <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">⌘K</kbd>
                    </Button>
                )}
                {/* Favorite toggle */}
                {currentPage && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleFavorite}
                        className={currentPage.isFavorite ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}
                        title={currentPage.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Star
                            className="w-5 h-5"
                            fill={currentPage.isFavorite ? 'currentColor' : 'none'}
                        />
                    </Button>
                )}

                {/* More actions */}
                {currentPage && (
                    <div className="relative">
                        <Button
                            ref={menuButtonRef}
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowMenu(!showMenu)}
                            title="More options"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                        {showMenu && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-full z-50 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
                            >
                                {onDuplicatePage && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            onDuplicatePage()
                                            setShowMenu(false)
                                        }}
                                        className="w-full justify-start rounded-none h-9 font-normal"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Duplicate
                                    </Button>
                                )}
                                {onToggleFullWidth && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            onToggleFullWidth()
                                            setShowMenu(false)
                                        }}
                                        className="w-full justify-start rounded-none h-9 font-normal"
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
                                    </Button>
                                )}
                                {onExportPage && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            onExportPage()
                                            setShowMenu(false)
                                        }}
                                        className="w-full justify-start rounded-none h-9 font-normal"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export JSON
                                    </Button>
                                )}
                                {onExportMarkdown && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            onExportMarkdown()
                                            setShowMenu(false)
                                        }}
                                        className="w-full justify-start rounded-none h-9 font-normal"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Export Markdown
                                    </Button>
                                )}
                                {onExportHtml && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            onExportHtml()
                                            setShowMenu(false)
                                        }}
                                        className="w-full justify-start rounded-none h-9 font-normal"
                                    >
                                        <Code className="w-4 h-4" />
                                        Export HTML
                                    </Button>
                                )}
                                {onDeletePage && (
                                    <>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                onDeletePage()
                                                setShowMenu(false)
                                            }}
                                            className="w-full justify-start rounded-none h-9 font-normal text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </Button>
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
