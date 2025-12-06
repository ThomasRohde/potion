/**
 * Topbar Component
 * 
 * Top navigation bar showing current page title and actions.
 */

import React, { useState, useRef, useEffect } from 'react'
import type { PageSummary } from '../types'

interface TopbarProps {
    currentPage: PageSummary | null
    sidebarCollapsed: boolean
    onToggleSidebar: () => void
    onOpenSearch?: () => void
    onRenameTitle?: (newTitle: string) => void
    onToggleFavorite?: () => void
    onOpenPageMenu?: () => void
    onDuplicatePage?: () => void
    onExportPage?: () => void
    onDeletePage?: () => void
}

export function Topbar({
    currentPage,
    sidebarCollapsed,
    onToggleSidebar,
    onOpenSearch,
    onRenameTitle,
    onToggleFavorite,
    onDuplicatePage,
    onExportPage,
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

    const startRename = () => {
        if (currentPage) {
            setEditTitle(currentPage.title || 'Untitled')
            setIsEditing(true)
            setShowMenu(false)
        }
    }
    return (
        <header className="h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center px-4 gap-2">
            {/* Sidebar toggle (visible when collapsed) */}
            {sidebarCollapsed && (
                <button
                    onClick={onToggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                    title="Open sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}

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
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
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
                        <svg
                            className="w-5 h-5"
                            fill={currentPage.isFavorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                        </svg>
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
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>
                        {showMenu && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-full z-50 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
                            >
                                <button
                                    onClick={startRename}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Rename
                                </button>
                                {onDuplicatePage && (
                                    <button
                                        onClick={() => {
                                            onDuplicatePage()
                                            setShowMenu(false)
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Duplicate
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
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export
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
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
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
