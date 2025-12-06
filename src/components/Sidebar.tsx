/**
 * Sidebar Component
 * 
 * Left sidebar with page tree navigation, favorites, and workspace controls.
 * Resizable and collapsible.
 */

import { useState, useCallback } from 'react'
import type { PageSummary } from '../types'
import type { PageTreeNode } from '../services/pageService'

interface SidebarProps {
    pages: PageTreeNode[]
    selectedPageId: string | null
    collapsed: boolean
    width: number
    onWidthChange: (width: number) => void
    onPageSelect: (page: PageSummary) => void
    onCreatePage: (parentPageId?: string) => void
    onToggleCollapse: () => void
}

export function Sidebar({
    pages,
    selectedPageId,
    collapsed,
    width,
    onPageSelect,
    onCreatePage,
    onToggleCollapse
}: SidebarProps) {
    const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())

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
                            onSelect={onPageSelect}
                            onToggleExpand={toggleExpanded}
                            onCreateChild={onCreatePage}
                        />
                    ))}
                </div>
            )}

            {/* Pages section */}
            <div className="flex-1 overflow-y-auto px-2 py-3">
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
                            onSelect={onPageSelect}
                            onToggleExpand={toggleExpanded}
                            onCreateChild={onCreatePage}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => onCreatePage()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New page
                </button>
            </div>
        </div>
    )
}

interface PageItemProps {
    page: PageTreeNode
    depth: number
    isSelected: boolean
    isExpanded: boolean
    onSelect: (page: PageSummary) => void
    onToggleExpand: (pageId: string) => void
    onCreateChild: (parentPageId: string) => void
}

function PageItem({
    page,
    depth,
    isSelected,
    isExpanded,
    onSelect,
    onToggleExpand,
    onCreateChild
}: PageItemProps) {
    const hasChildren = page.children && page.children.length > 0
    const [showActions, setShowActions] = useState(false)

    return (
        <div>
            <div
                className={`
                    group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer
                    ${isSelected
                        ? 'bg-potion-100 dark:bg-potion-900/30 text-potion-700 dark:text-potion-300'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                `}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
                onClick={() => onSelect(page)}
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

                {/* Title */}
                <span className="text-sm truncate flex-1">
                    {page.title || 'Untitled'}
                </span>

                {/* Actions */}
                {showActions && (
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
                )}
            </div>

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
                            onSelect={onSelect}
                            onToggleExpand={onToggleExpand}
                            onCreateChild={onCreateChild}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
