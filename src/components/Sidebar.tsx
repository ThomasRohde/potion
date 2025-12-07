/**
 * Sidebar Component (Refactored with ShadCN Sidebar)
 * 
 * Left sidebar with page tree navigation, favorites, and workspace controls.
 * Uses ShadCN Sidebar primitives for collapsible sections and consistent styling.
 * Resizable and collapsible.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuAction,
} from '@/components/ui/sidebar'
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
    const [favoritesOpen, setFavoritesOpen] = useState(true)
    const [pagesOpen, setPagesOpen] = useState(true)

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
            <div className="w-12 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleCollapse}
                        >
                            <ChevronsRight className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Expand sidebar</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onCreatePage()}
                            className="mt-4"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">New page</TooltipContent>
                </Tooltip>
            </div>
        )
    }

    return (
        <div
            data-testid="sidebar"
            className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col"
            style={{ width: `${width}px`, minWidth: '200px', maxWidth: '400px' }}
        >
            {/* Header */}
            <SidebarHeader className="p-4 flex flex-row items-center justify-between border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-potion-600 dark:text-potion-400" />
                    <span className="font-semibold">Potion</span>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleCollapse}
                            className="h-7 w-7"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Collapse sidebar</TooltipContent>
                </Tooltip>
            </SidebarHeader>

            <SidebarContent className="flex-1 overflow-y-auto">
                {/* Favorites section - Collapsible */}
                {favoritePages.length > 0 && (
                    <Collapsible.Root open={favoritesOpen} onOpenChange={setFavoritesOpen}>
                        <SidebarGroup className="border-b border-sidebar-border py-2">
                            <SidebarGroupLabel asChild className="px-2">
                                <Collapsible.Trigger className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1.5 text-muted-foreground">
                                    <ChevronDown className={`w-3 h-3 transition-transform ${favoritesOpen ? '' : '-rotate-90'}`} />
                                    Favorites
                                </Collapsible.Trigger>
                            </SidebarGroupLabel>
                            <Collapsible.Content>
                                <SidebarGroupContent className="px-2 pt-1">
                                    <SidebarMenu>
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
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </Collapsible.Content>
                        </SidebarGroup>
                    </Collapsible.Root>
                )}

                {/* Pages section - Collapsible */}
                <Collapsible.Root open={pagesOpen} onOpenChange={setPagesOpen}>
                    <SidebarGroup
                        className={`flex-1 py-2 ${dragOverRoot ? 'bg-potion-50 dark:bg-potion-900/20' : ''}`}
                        onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            setDragOverRoot(true)
                        }}
                        onDragLeave={(e) => {
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
                                onMovePage(pageId, null)
                            }
                        }}
                    >
                        <div className="flex items-center justify-between pr-2">
                            <SidebarGroupLabel asChild className="px-2 flex-1">
                                <Collapsible.Trigger className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1.5 text-muted-foreground">
                                    <ChevronDown className={`w-3 h-3 transition-transform ${pagesOpen ? '' : '-rotate-90'}`} />
                                    Pages
                                </Collapsible.Trigger>
                            </SidebarGroupLabel>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onCreatePage()}
                                        className="h-6 w-6"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>New page</TooltipContent>
                            </Tooltip>
                        </div>
                        <Collapsible.Content>
                            <SidebarGroupContent className="px-2 pt-1">
                                {pages.length === 0 ? (
                                    <p className="px-2 text-sm text-muted-foreground">
                                        No pages yet
                                    </p>
                                ) : (
                                    <SidebarMenu>
                                        {pages.map(page => (
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
                                    </SidebarMenu>
                                )}
                            </SidebarGroupContent>
                        </Collapsible.Content>
                    </SidebarGroup>
                </Collapsible.Root>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="p-2 border-t border-sidebar-border space-y-1">
                {/* New page/database dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            data-testid="new-page-button"
                            className="w-full justify-start"
                        >
                            <Plus className="w-4 h-4" />
                            New
                            <ChevronDown className="w-3 h-3 ml-auto" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        <DropdownMenuItem onSelect={() => onCreatePage()}>
                            <FileText className="w-4 h-4" />
                            New page
                        </DropdownMenuItem>
                        {onCreateDatabase && (
                            <DropdownMenuItem onSelect={() => onCreateDatabase()}>
                                <Database className="w-4 h-4" />
                                New database
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={onExportWorkspace}
                                className="flex-1 h-8 text-xs"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export workspace to JSON</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={onImportWorkspace}
                                className="flex-1 h-8 text-xs"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Import
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Import workspace from JSON</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onShowHelp}
                                className="h-8 w-8"
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onOpenSettings}
                                className="h-8 w-8"
                            >
                                <Settings className="w-3.5 h-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Settings</TooltipContent>
                    </Tooltip>
                    {theme && onToggleTheme && (
                        <ThemeToggle
                            theme={theme}
                            onToggle={onToggleTheme}
                            className="px-2 py-1.5"
                            data-testid="theme-toggle"
                        />
                    )}
                </div>
            </SidebarFooter>
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
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(page.title)
    const [isDragging, setIsDragging] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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
    }

    const startRename = () => {
        setEditTitle(page.title)
        setIsEditing(true)
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
        <SidebarMenuItem className="relative">
            <SidebarMenuButton
                isActive={isSelected}
                className={`
                    group gap-1
                    ${isDragging ? 'opacity-50' : ''}
                    ${isDragOver ? 'ring-2 ring-potion-500 bg-sidebar-accent' : ''}
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
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleExpand(page.id)
                    }}
                    className={`h-5 w-5 flex items-center justify-center shrink-0 ${hasChildren ? 'visible' : 'invisible'}`}
                >
                    <ChevronRight
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                </button>

                {/* Icon */}
                <PageIcon type={page.type} icon={page.icon} size="sm" className="shrink-0" />

                {/* Title - editable or static */}
                {isEditing ? (
                    <Input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleRenameKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm flex-1 h-auto py-0.5"
                    />
                ) : (
                    <span className="text-sm truncate flex-1">
                        {page.title || 'Untitled'}
                    </span>
                )}

                {/* Actions */}
                {showActions && !isEditing && (
                    <SidebarMenuAction showOnHover className="flex items-center gap-0.5 right-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onCreateChild(page.id)
                                    }}
                                    className="h-5 w-5 flex items-center justify-center hover:bg-sidebar-accent rounded"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Add child page</TooltipContent>
                        </Tooltip>
                        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                            <Tooltip open={isDropdownOpen ? false : undefined}>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-5 w-5 flex items-center justify-center hover:bg-sidebar-accent rounded"
                                        >
                                            <MoreVertical className="w-3 h-3" />
                                        </button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>More options</TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                    onSelect={() => {
                                        if (onToggleFavorite) {
                                            onToggleFavorite(page.id, !page.isFavorite)
                                        }
                                    }}
                                >
                                    <Star className="w-4 h-4" fill={page.isFavorite ? "currentColor" : "none"} />
                                    {page.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={startRename}>
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        if (onExportPage) {
                                            onExportPage(page.id, true)
                                        }
                                    }}
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={handleDelete}
                                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuAction>
                )}
            </SidebarMenuButton>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="ml-2">
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
        </SidebarMenuItem>
    )
}
