/**
 * Search Dialog Component
 * 
 * Modal overlay for searching pages by title and content.
 * Opens with Ctrl/Cmd+K shortcut.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import type { SearchResult } from '../services'
import { searchPagesWithSnippets } from '../services'
import { PageIcon } from './PageIcon'
import { Input } from '@/components/ui/input'

interface SearchDialogProps {
    isOpen: boolean
    workspaceId: string
    onClose: () => void
    onSelectPage: (pageId: string) => void
}

export function SearchDialog({
    isOpen,
    workspaceId,
    onClose,
    onSelectPage
}: SearchDialogProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isSearching, setIsSearching] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setResults([])
            setSelectedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 10)
        }
    }, [isOpen])

    // Debounced search
    useEffect(() => {
        if (!query.trim() || !workspaceId) {
            setResults([])
            return
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true)
            try {
                const searchResults = await searchPagesWithSnippets(workspaceId, query.trim())
                setResults(searchResults)
                setSelectedIndex(0)
            } catch (error) {
                console.error('Search failed:', error)
                setResults([])
            } finally {
                setIsSearching(false)
            }
        }, 100) // 100ms debounce for responsiveness

        return () => clearTimeout(timeoutId)
    }, [query, workspaceId])

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current && results.length > 0) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' })
            }
        }
    }, [selectedIndex, results.length])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(i => Math.min(i + 1, results.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(i => Math.max(i - 1, 0))
                break
            case 'Enter':
                e.preventDefault()
                if (results[selectedIndex]) {
                    onSelectPage(results[selectedIndex].page.id)
                    onClose()
                }
                break
            case 'Escape':
                e.preventDefault()
                onClose()
                break
        }
    }, [results, selectedIndex, onSelectPage, onClose])

    const handleResultClick = useCallback((pageId: string) => {
        onSelectPage(pageId)
        onClose()
    }, [onSelectPage, onClose])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search pages..."
                        className="flex-1 border-0 shadow-none focus-visible:ring-0 h-auto px-0 py-0"
                    />
                    {isSearching && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-potion-600" />
                    )}
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
                        Esc
                    </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
                    {query.trim() === '' ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <p className="text-sm">Start typing to search pages</p>
                            <p className="text-xs mt-1">Search by title or content</p>
                        </div>
                    ) : results.length === 0 && !isSearching ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <p className="text-sm">No pages found</p>
                            <p className="text-xs mt-1">Try a different search term</p>
                        </div>
                    ) : (
                        results.map((result, index) => (
                            <div
                                key={result.page.id}
                                className={`
                                    px-4 py-3 cursor-pointer
                                    ${index === selectedIndex
                                        ? 'bg-potion-50 dark:bg-potion-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }
                                `}
                                onClick={() => handleResultClick(result.page.id)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="flex items-center gap-2">
                                    <PageIcon type={result.page.type} icon={result.page.icon} size="sm" className="shrink-0 text-gray-500 dark:text-gray-400" />
                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {result.page.title || 'Untitled'}
                                    </span>
                                    {result.matchType === 'content' && (
                                        <span className="text-xs text-gray-400 shrink-0">
                                            (in content)
                                        </span>
                                    )}
                                </div>
                                {result.snippet && (
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate pl-6">
                                        {result.snippet}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
                            to open
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
