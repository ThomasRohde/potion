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
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'

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
    const inputRef = useRef<HTMLInputElement>(null)

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
                            <Input
                                ref={inputRef}
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleTitleSubmit}
                                onKeyDown={handleTitleKeyDown}
                                className="h-auto py-0.5 text-sm font-medium flex-1 min-w-0"
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
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={onOpenSearch}
                                className="gap-2"
                            >
                                <Search className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm">Search</span>
                                <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">⌘K</kbd>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Search (Ctrl+K)</TooltipContent>
                    </Tooltip>
                )}
                {/* Favorite toggle */}
                {currentPage && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleFavorite}
                                className={currentPage.isFavorite ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}
                            >
                                <Star
                                    className="w-5 h-5"
                                    fill={currentPage.isFavorite ? 'currentColor' : 'none'}
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {currentPage.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* More actions */}
                {currentPage && (
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>More options</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-48">
                            {onDuplicatePage && (
                                <DropdownMenuItem onSelect={onDuplicatePage}>
                                    <Copy className="w-4 h-4" />
                                    Duplicate
                                </DropdownMenuItem>
                            )}
                            {onToggleFullWidth && (
                                <DropdownMenuItem onSelect={onToggleFullWidth}>
                                    {isFullWidth ? (
                                        <Minimize2 className="w-4 h-4" />
                                    ) : (
                                        <Maximize2 className="w-4 h-4" />
                                    )}
                                    <span className="flex-1">Full width</span>
                                    {isFullWidth && (
                                        <Check className="w-4 h-4 text-potion-500" />
                                    )}
                                </DropdownMenuItem>
                            )}
                            {onExportPage && (
                                <DropdownMenuItem onSelect={onExportPage}>
                                    <Download className="w-4 h-4" />
                                    Export JSON
                                </DropdownMenuItem>
                            )}
                            {onExportMarkdown && (
                                <DropdownMenuItem onSelect={onExportMarkdown}>
                                    <FileText className="w-4 h-4" />
                                    Export Markdown
                                </DropdownMenuItem>
                            )}
                            {onExportHtml && (
                                <DropdownMenuItem onSelect={onExportHtml}>
                                    <Code className="w-4 h-4" />
                                    Export HTML
                                </DropdownMenuItem>
                            )}
                            {onDeletePage && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={onDeletePage}
                                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    )
}
