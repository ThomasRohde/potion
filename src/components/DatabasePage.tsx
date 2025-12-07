/**
 * DatabasePage Component
 * 
 * Page component for viewing and editing database content.
 * Displays database properties, table view, and allows inline editing.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import type { Page, Database, Row, PropertyDefinition } from '../types'
import { getDatabase, getFullRows, updateDatabaseProperties } from '../services'
import { DatabaseView } from './DatabaseView'
import { PropertyEditor } from './PropertyEditor'
import { PageIcon } from './PageIcon'
import { Input } from '@/components/ui/input'

interface DatabasePageProps {
    page: Page
    onTitleChange: (title: string) => void
}

export function DatabasePage({ page, onTitleChange }: DatabasePageProps) {
    const navigate = useNavigate()
    const [database, setDatabase] = useState<Database | null>(null)
    const [rows, setRows] = useState<Row[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [titleValue, setTitleValue] = useState(page.title)

    // Load database and rows
    useEffect(() => {
        async function load() {
            setIsLoading(true)
            try {
                const db = await getDatabase(page.id)
                setDatabase(db)

                if (db) {
                    const dbRows = await getFullRows(page.id)
                    setRows(dbRows)
                }
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [page.id])

    // Update title when page changes
    useEffect(() => {
        setTitleValue(page.title)
    }, [page.title])

    const handleRefreshRows = useCallback(async () => {
        const dbRows = await getFullRows(page.id)
        setRows(dbRows)
    }, [page.id])

    const handleOpenRow = useCallback((_rowId: string, pageId: string) => {
        navigate(`/page/${pageId}`)
    }, [navigate])

    const handlePropertiesChange = useCallback(async (properties: PropertyDefinition[]) => {
        if (!database) return
        const updated = await updateDatabaseProperties(page.id, properties)
        setDatabase(updated)
    }, [database, page.id])

    const handleTitleSubmit = () => {
        if (titleValue.trim() !== page.title) {
            onTitleChange(titleValue.trim() || 'Untitled')
        }
        setIsEditingTitle(false)
    }

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-8 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
            </div>
        )
    }

    if (!database) {
        return (
            <div className="max-w-5xl mx-auto px-8 py-12">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>Database not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <PageIcon type="database" icon={page.icon} size="lg" className="text-gray-600 dark:text-gray-400" />
                    {isEditingTitle ? (
                        <Input
                            type="text"
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleTitleSubmit()
                                if (e.key === 'Escape') {
                                    setTitleValue(page.title)
                                    setIsEditingTitle(false)
                                }
                            }}
                            className="text-3xl font-bold h-auto py-1"
                            autoFocus
                        />
                    ) : (
                        <h1
                            onClick={() => setIsEditingTitle(true)}
                            className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 -mx-2 rounded"
                        >
                            {page.title || 'Untitled'}
                        </h1>
                    )}
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showPropertiesPanel
                            ? 'bg-potion-100 dark:bg-potion-900/30 text-potion-700 dark:text-potion-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Properties
                    </button>
                    <span className="text-gray-400 dark:text-gray-500">
                        {rows.length} {rows.length === 1 ? 'row' : 'rows'}
                    </span>
                </div>
            </div>

            {/* Properties Panel */}
            {showPropertiesPanel && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Properties
                    </h3>
                    <PropertyEditor
                        properties={database.properties}
                        onChange={handlePropertiesChange}
                    />
                </div>
            )}

            {/* Table View */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <DatabaseView
                    database={database}
                    rows={rows}
                    workspaceId={page.workspaceId}
                    onRowsChange={handleRefreshRows}
                    onOpenRow={handleOpenRow}
                    onPropertiesChange={handlePropertiesChange}
                />
            </div>

            {/* Empty state */}
            {rows.length === 0 && (
                <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No rows yet</p>
                    <p className="text-sm">Click "New row" above to add your first entry</p>
                </div>
            )}
        </div>
    )
}
