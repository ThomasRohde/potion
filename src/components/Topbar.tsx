/**
 * Topbar Component
 * 
 * Top navigation bar showing current page title and actions.
 */

import type { PageSummary } from '../types'

interface TopbarProps {
    currentPage: PageSummary | null
    sidebarCollapsed: boolean
    onToggleSidebar: () => void
    onOpenSearch?: () => void
}

export function Topbar({
    currentPage,
    sidebarCollapsed,
    onToggleSidebar,
    onOpenSearch
}: TopbarProps) {
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
                        <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {currentPage.title || 'Untitled'}
                        </h1>
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
                <button
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500"
                    title="More options"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>
        </header>
    )
}
