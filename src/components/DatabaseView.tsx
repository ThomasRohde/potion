/**
 * DatabaseView Component
 * 
 * Displays database content in a table view with inline editing.
 * Supports filtering, sorting, and adding new rows.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { Database, Row, PropertyDefinition, PropertyType, SelectOption, Filter, Sort, DatabaseView as DatabaseViewType } from '../types'
import { PROPERTY_TYPE_ICONS, updateRowValue, updateRowTitle, createRow, deleteRow as deleteRowService, getPage, updateDatabaseViews } from '../services'
import { getSelectOptionColorClass } from './PropertyEditor'

// Filter operator labels
const FILTER_OPERATOR_LABELS: Record<Filter['operator'], string> = {
    equals: 'is',
    notEquals: 'is not',
    contains: 'contains',
    notContains: 'does not contain',
    isEmpty: 'is empty',
    isNotEmpty: 'is not empty',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤'
}

// Operators available for each property type
const OPERATORS_BY_TYPE: Record<PropertyType, Filter['operator'][]> = {
    text: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty'],
    number: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
    date: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
    checkbox: ['equals'],
    select: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty'],
    multiSelect: ['contains', 'notContains', 'isEmpty', 'isNotEmpty'],
    url: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty']
}

interface DatabaseViewProps {
    database: Database
    rows: Row[]
    workspaceId: string
    onRowsChange: () => void
    onOpenRow: (rowId: string, pageId: string) => void
    onPropertiesChange: (properties: PropertyDefinition[]) => void
    onViewChange?: (view: DatabaseViewType) => void
}

export function DatabaseView({
    database,
    rows,
    workspaceId,
    onRowsChange,
    onOpenRow,
    onPropertiesChange,
    onViewChange
}: DatabaseViewProps) {
    const [rowTitles, setRowTitles] = useState<Record<string, string>>({})
    const [editingCell, setEditingCell] = useState<{ rowId: string; propertyId: string } | null>(null)
    const [isAddingRow, setIsAddingRow] = useState(false)
    const [showFilterMenu, setShowFilterMenu] = useState(false)

    // Get current view (first view or create default) - memoized to prevent unnecessary recalculations
    const currentView = useMemo(() => database.views[0] ?? {
        id: crypto.randomUUID(),
        name: 'Table View',
        type: 'table' as const,
        filters: [],
        sorts: []
    }, [database.views])

    // Local state for filters and sorts (to allow editing before saving)
    const [filters, setFilters] = useState<Filter[]>(currentView.filters)
    const [sorts, setSorts] = useState<Sort[]>(currentView.sorts)

    // Sync with database view when it changes
    useEffect(() => {
        setFilters(currentView.filters)
        setSorts(currentView.sorts)
    }, [currentView.filters, currentView.sorts])

    // Persist view changes
    const persistView = useCallback(async (newFilters: Filter[], newSorts: Sort[]) => {
        const updatedView: DatabaseViewType = {
            ...currentView,
            filters: newFilters,
            sorts: newSorts
        }
        const updatedViews = [updatedView, ...database.views.slice(1)]
        await updateDatabaseViews(database.pageId, updatedViews)
        onViewChange?.(updatedView)
    }, [currentView, database.pageId, database.views, onViewChange])

    // Load row titles from their associated pages
    useEffect(() => {
        async function loadTitles() {
            const titles: Record<string, string> = {}
            for (const row of rows) {
                const page = await getPage(row.pageId)
                titles[row.id] = page?.title || 'Untitled'
            }
            setRowTitles(titles)
        }
        loadTitles()
    }, [rows])

    // Apply filters to rows
    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            for (const filter of filters) {
                const value = filter.propertyId === 'title'
                    ? rowTitles[row.id] || ''
                    : row.values[filter.propertyId]

                if (!matchesFilter(value, filter)) {
                    return false
                }
            }
            return true
        })
    }, [rows, filters, rowTitles])

    // Apply sorts to filtered rows
    const sortedRows = useMemo(() => {
        if (sorts.length === 0) return filteredRows

        return [...filteredRows].sort((a, b) => {
            for (const sort of sorts) {
                const aVal = sort.propertyId === 'title'
                    ? rowTitles[a.id] || ''
                    : a.values[sort.propertyId]
                const bVal = sort.propertyId === 'title'
                    ? rowTitles[b.id] || ''
                    : b.values[sort.propertyId]

                const comparison = compareValues(aVal, bVal)
                if (comparison !== 0) {
                    return sort.direction === 'asc' ? comparison : -comparison
                }
            }
            return 0
        })
    }, [filteredRows, sorts, rowTitles])

    // Handle adding a filter
    const handleAddFilter = useCallback((propertyId: string, type: PropertyType) => {
        const defaultOperator = OPERATORS_BY_TYPE[type][0]
        const newFilter: Filter = {
            propertyId,
            operator: defaultOperator,
            value: type === 'checkbox' ? true : ''
        }
        const newFilters = [...filters, newFilter]
        setFilters(newFilters)
        persistView(newFilters, sorts)
        setShowFilterMenu(false)
    }, [filters, sorts, persistView])

    // Handle updating a filter
    const handleUpdateFilter = useCallback((index: number, updates: Partial<Filter>) => {
        const newFilters = filters.map((f, i) => i === index ? { ...f, ...updates } : f)
        setFilters(newFilters)
        persistView(newFilters, sorts)
    }, [filters, sorts, persistView])

    // Handle removing a filter
    const handleRemoveFilter = useCallback((index: number) => {
        const newFilters = filters.filter((_, i) => i !== index)
        setFilters(newFilters)
        persistView(newFilters, sorts)
    }, [filters, sorts, persistView])

    // Handle toggling sort on a column
    const handleToggleSort = useCallback((propertyId: string) => {
        const existingIndex = sorts.findIndex(s => s.propertyId === propertyId)
        let newSorts: Sort[]

        if (existingIndex === -1) {
            // Add ascending sort
            newSorts = [{ propertyId, direction: 'asc' }]
        } else if (sorts[existingIndex].direction === 'asc') {
            // Change to descending
            newSorts = [{ propertyId, direction: 'desc' }]
        } else {
            // Remove sort
            newSorts = []
        }

        setSorts(newSorts)
        persistView(filters, newSorts)
    }, [sorts, filters, persistView])

    // Get sort direction for a property
    const getSortDirection = useCallback((propertyId: string) => {
        const sort = sorts.find(s => s.propertyId === propertyId)
        return sort?.direction
    }, [sorts])

    const handleAddRow = useCallback(async () => {
        setIsAddingRow(true)
        try {
            await createRow(database.pageId, workspaceId)
            onRowsChange()
        } finally {
            setIsAddingRow(false)
        }
    }, [database.pageId, workspaceId, onRowsChange])

    const handleDeleteRow = useCallback(async (rowId: string) => {
        await deleteRowService(rowId)
        onRowsChange()
    }, [onRowsChange])

    const handleCellChange = useCallback(async (rowId: string, propertyId: string, value: unknown) => {
        await updateRowValue(rowId, propertyId, value)
        setEditingCell(null)
        onRowsChange()
    }, [onRowsChange])

    const handleTitleChange = useCallback(async (rowId: string, title: string) => {
        await updateRowTitle(rowId, title)
        setRowTitles(prev => ({ ...prev, [rowId]: title }))
        setEditingCell(null)
    }, [])

    // Get property name by ID (including title)
    const getPropertyName = useCallback((propertyId: string) => {
        if (propertyId === 'title') return 'Title'
        return database.properties.find(p => p.id === propertyId)?.name ?? 'Unknown'
    }, [database.properties])

    // Get property type by ID
    const getPropertyType = useCallback((propertyId: string): PropertyType => {
        if (propertyId === 'title') return 'text'
        return database.properties.find(p => p.id === propertyId)?.type ?? 'text'
    }, [database.properties])

    return (
        <div className="space-y-3">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Active Filters */}
                {filters.map((filter, index) => (
                    <FilterPill
                        key={index}
                        filter={filter}
                        propertyName={getPropertyName(filter.propertyId)}
                        propertyType={getPropertyType(filter.propertyId)}
                        properties={database.properties}
                        onUpdate={(updates) => handleUpdateFilter(index, updates)}
                        onRemove={() => handleRemoveFilter(index)}
                    />
                ))}

                {/* Add Filter Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                    </button>

                    {showFilterMenu && (
                        <div className="absolute left-0 top-full z-20 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[150px]">
                            <button
                                onClick={() => handleAddFilter('title', 'text')}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <span className="w-5 text-center text-gray-400">📝</span>
                                Title
                            </button>
                            {database.properties.map(property => (
                                <button
                                    key={property.id}
                                    onClick={() => handleAddFilter(property.id, property.type)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <span className="w-5 text-center text-gray-400">{PROPERTY_TYPE_ICONS[property.type]}</span>
                                    {property.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Clear All Filters */}
                {filters.length > 0 && (
                    <button
                        onClick={() => {
                            setFilters([])
                            persistView([], sorts)
                        }}
                        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        Clear all
                    </button>
                )}

                {/* Row count */}
                <span className="ml-auto text-sm text-gray-400">
                    {sortedRows.length} {sortedRows.length === 1 ? 'row' : 'rows'}
                    {filters.length > 0 && ` (filtered from ${rows.length})`}
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            {/* Title column */}
                            <th className="text-left px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 min-w-[200px]">
                                <button
                                    onClick={() => handleToggleSort('title')}
                                    className="flex items-center gap-2 hover:text-gray-800 dark:hover:text-gray-200"
                                >
                                    <span>📝</span>
                                    Title
                                    <SortIndicator direction={getSortDirection('title')} />
                                </button>
                            </th>
                            {/* Property columns */}
                            {database.properties.map(property => (
                                <PropertyHeader
                                    key={property.id}
                                    property={property}
                                    sortDirection={getSortDirection(property.id)}
                                    onSort={() => handleToggleSort(property.id)}
                                    onUpdate={(updates) => {
                                        const updatedProperties = database.properties.map(p =>
                                            p.id === property.id ? { ...p, ...updates } : p
                                        )
                                        onPropertiesChange(updatedProperties)
                                    }}
                                    onDelete={() => {
                                        const updatedProperties = database.properties.filter(p => p.id !== property.id)
                                        onPropertiesChange(updatedProperties)
                                    }}
                                />
                            ))}
                            {/* Add property column */}
                            <th className="px-3 py-2 bg-gray-50 dark:bg-gray-800 w-10">
                                <AddPropertyButton
                                    onAdd={(type) => {
                                        const newProperty: PropertyDefinition = {
                                            id: crypto.randomUUID(),
                                            name: 'New property',
                                            type,
                                            ...(type === 'select' || type === 'multiSelect' ? { options: [] } : {})
                                        }
                                        onPropertiesChange([...database.properties, newProperty])
                                    }}
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map(row => (
                            <tr
                                key={row.id}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                            >
                                {/* Title cell */}
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onOpenRow(row.id, row.pageId)}
                                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Open as page"
                                        >
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </button>
                                        <EditableCell
                                            value={rowTitles[row.id] || 'Untitled'}
                                            type="text"
                                            isEditing={editingCell?.rowId === row.id && editingCell?.propertyId === 'title'}
                                            onStartEdit={() => setEditingCell({ rowId: row.id, propertyId: 'title' })}
                                            onEndEdit={(value) => handleTitleChange(row.id, String(value))}
                                            onCancel={() => setEditingCell(null)}
                                        />
                                    </div>
                                </td>
                                {/* Property cells */}
                                {database.properties.map(property => (
                                    <td key={property.id} className="px-3 py-2">
                                        <EditableCell
                                            value={row.values[property.id]}
                                            type={property.type}
                                            options={property.options}
                                            isEditing={editingCell?.rowId === row.id && editingCell?.propertyId === property.id}
                                            onStartEdit={() => setEditingCell({ rowId: row.id, propertyId: property.id })}
                                            onEndEdit={(value) => handleCellChange(row.id, property.id, value)}
                                            onCancel={() => setEditingCell(null)}
                                        />
                                    </td>
                                ))}
                                {/* Actions cell */}
                                <td className="px-3 py-2 w-10">
                                    <button
                                        onClick={() => handleDeleteRow(row.id)}
                                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete row"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {/* Add row button */}
                        <tr>
                            <td colSpan={database.properties.length + 2} className="px-3 py-2">
                                <button
                                    onClick={handleAddRow}
                                    disabled={isAddingRow}
                                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {isAddingRow ? 'Adding...' : 'New row'}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ============================================
// Sort Indicator Component
// ============================================

interface SortIndicatorProps {
    direction?: 'asc' | 'desc'
}

function SortIndicator({ direction }: SortIndicatorProps) {
    if (!direction) {
        return null
    }

    return (
        <svg
            className={`w-3 h-3 text-potion-500 ${direction === 'desc' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
    )
}

// ============================================
// Filter Pill Component
// ============================================

interface FilterPillProps {
    filter: Filter
    propertyName: string
    propertyType: PropertyType
    properties: PropertyDefinition[]
    onUpdate: (updates: Partial<Filter>) => void
    onRemove: () => void
}

function FilterPill({ filter, propertyName, propertyType, properties, onUpdate, onRemove }: FilterPillProps) {
    const [showEditor, setShowEditor] = useState(false)
    const operators = OPERATORS_BY_TYPE[propertyType]

    // Get the property for select options
    const property = properties.find(p => p.id === filter.propertyId)

    const getValueDisplay = () => {
        if (filter.operator === 'isEmpty' || filter.operator === 'isNotEmpty') {
            return ''
        }
        if (propertyType === 'checkbox') {
            return filter.value ? 'checked' : 'unchecked'
        }
        if (propertyType === 'select' && property?.options) {
            const option = property.options.find(o => o.id === filter.value)
            return option?.name || String(filter.value)
        }
        return String(filter.value || '')
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowEditor(!showEditor)}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-potion-50 dark:bg-potion-900/30 text-potion-700 dark:text-potion-300 rounded border border-potion-200 dark:border-potion-700 hover:bg-potion-100 dark:hover:bg-potion-800/50"
            >
                <span className="font-medium">{propertyName}</span>
                <span className="text-potion-500">{FILTER_OPERATOR_LABELS[filter.operator]}</span>
                {getValueDisplay() && <span>"{getValueDisplay()}"</span>}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    className="ml-1 p-0.5 hover:bg-potion-200 dark:hover:bg-potion-700 rounded"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </button>

            {showEditor && (
                <div className="absolute left-0 top-full z-20 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[250px]">
                    <div className="space-y-3">
                        {/* Operator selector */}
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Operator</label>
                            <select
                                value={filter.operator}
                                onChange={(e) => onUpdate({ operator: e.target.value as Filter['operator'] })}
                                className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                            >
                                {operators.map(op => (
                                    <option key={op} value={op}>{FILTER_OPERATOR_LABELS[op]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Value input (unless isEmpty/isNotEmpty) */}
                        {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Value</label>
                                {propertyType === 'checkbox' ? (
                                    <select
                                        value={filter.value ? 'true' : 'false'}
                                        onChange={(e) => onUpdate({ value: e.target.value === 'true' })}
                                        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                                    >
                                        <option value="true">Checked</option>
                                        <option value="false">Unchecked</option>
                                    </select>
                                ) : propertyType === 'select' && property?.options ? (
                                    <select
                                        value={String(filter.value || '')}
                                        onChange={(e) => onUpdate({ value: e.target.value })}
                                        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                                    >
                                        <option value="">Select...</option>
                                        {property.options.map(option => (
                                            <option key={option.id} value={option.id}>{option.name}</option>
                                        ))}
                                    </select>
                                ) : propertyType === 'number' ? (
                                    <input
                                        type="number"
                                        value={filter.value as number || ''}
                                        onChange={(e) => onUpdate({ value: e.target.value ? Number(e.target.value) : '' })}
                                        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                                    />
                                ) : propertyType === 'date' ? (
                                    <input
                                        type="date"
                                        value={String(filter.value || '')}
                                        onChange={(e) => onUpdate({ value: e.target.value })}
                                        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={String(filter.value || '')}
                                        onChange={(e) => onUpdate({ value: e.target.value })}
                                        placeholder="Enter value..."
                                        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                                    />
                                )}
                            </div>
                        )}

                        {/* Done button */}
                        <button
                            onClick={() => setShowEditor(false)}
                            className="w-full px-3 py-1.5 text-sm bg-potion-500 text-white rounded hover:bg-potion-600"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

interface PropertyHeaderProps {
    property: PropertyDefinition
    sortDirection?: 'asc' | 'desc'
    onSort: () => void
    onUpdate: (updates: Partial<PropertyDefinition>) => void
    onDelete: () => void
}

function PropertyHeader({ property, sortDirection, onSort, onUpdate, onDelete }: PropertyHeaderProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    return (
        <th className="text-left px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 min-w-[150px] relative group">
            <div className="flex items-center gap-2">
                <button
                    onClick={onSort}
                    className="flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    <span className="text-gray-400">{PROPERTY_TYPE_ICONS[property.type]}</span>
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={property.name}
                            onChange={(e) => onUpdate({ name: e.target.value })}
                            onBlur={() => setIsEditing(false)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                    setIsEditing(false)
                                }
                            }}
                            className="flex-1 bg-white dark:bg-gray-700 border border-potion-500 rounded px-1 py-0.5 text-sm font-normal outline-none"
                        />
                    ) : (
                        <span className="cursor-pointer">
                            {property.name}
                        </span>
                    )}
                    <SortIndicator direction={sortDirection} />
                </button>
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {showMenu && (
                <div className="absolute left-0 top-full z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]">
                    <button
                        onClick={() => {
                            setIsEditing(true)
                            setShowMenu(false)
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Rename
                    </button>
                    <button
                        onClick={() => {
                            onDelete()
                            setShowMenu(false)
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Delete
                    </button>
                </div>
            )}
        </th>
    )
}

interface AddPropertyButtonProps {
    onAdd: (type: PropertyType) => void
}

function AddPropertyButton({ onAdd }: AddPropertyButtonProps) {
    const [showMenu, setShowMenu] = useState(false)

    const propertyTypes: PropertyType[] = ['text', 'number', 'date', 'checkbox', 'select', 'multiSelect', 'url']

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Add property"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[150px]">
                    {propertyTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => {
                                onAdd(type)
                                setShowMenu(false)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <span className="w-5 text-center text-gray-400">{PROPERTY_TYPE_ICONS[type]}</span>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

interface EditableCellProps {
    value: unknown
    type: PropertyType
    options?: SelectOption[]
    isEditing: boolean
    onStartEdit: () => void
    onEndEdit: (value: unknown) => void
    onCancel: () => void
}

function EditableCell({
    value,
    type,
    options,
    isEditing,
    onStartEdit,
    onEndEdit,
    onCancel
}: EditableCellProps) {
    const [localValue, setLocalValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setLocalValue(value)
    }, [value])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            if (type === 'text' || type === 'url' || type === 'number') {
                inputRef.current.select()
            }
        }
    }, [isEditing, type])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onEndEdit(localValue)
        } else if (e.key === 'Escape') {
            setLocalValue(value)
            onCancel()
        }
    }

    // Checkbox - always inline
    if (type === 'checkbox') {
        return (
            <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onEndEdit(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-potion-600 focus:ring-potion-500"
            />
        )
    }

    // Select - show dropdown
    if (type === 'select') {
        const selectedOption = options?.find(o => o.id === value)

        if (isEditing) {
            return (
                <select
                    autoFocus
                    value={String(value || '')}
                    onChange={(e) => onEndEdit(e.target.value || null)}
                    onBlur={() => onCancel()}
                    className="w-full bg-white dark:bg-gray-700 border border-potion-500 rounded px-2 py-1 text-sm outline-none"
                >
                    <option value="">Select...</option>
                    {options?.map(option => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                </select>
            )
        }

        if (selectedOption) {
            const colorClasses = getSelectOptionColorClass(selectedOption.color)
            return (
                <span
                    onClick={onStartEdit}
                    className={`inline-block px-2 py-0.5 rounded text-sm cursor-pointer ${colorClasses.bg} ${colorClasses.text}`}
                >
                    {selectedOption.name}
                </span>
            )
        }

        return (
            <span
                onClick={onStartEdit}
                className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
            >
                Select...
            </span>
        )
    }

    // Multi-select - show pills
    if (type === 'multiSelect') {
        const selectedIds = Array.isArray(value) ? value : []
        const selectedOptions = options?.filter(o => selectedIds.includes(o.id)) || []

        // For now, just show selected options (full multi-select editor would be more complex)
        return (
            <div onClick={onStartEdit} className="flex flex-wrap gap-1 cursor-pointer min-h-[24px]">
                {selectedOptions.length > 0 ? (
                    selectedOptions.map(option => {
                        const colorClasses = getSelectOptionColorClass(option.color)
                        return (
                            <span
                                key={option.id}
                                className={`inline-block px-2 py-0.5 rounded text-xs ${colorClasses.bg} ${colorClasses.text}`}
                            >
                                {option.name}
                            </span>
                        )
                    })
                ) : (
                    <span className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        Select...
                    </span>
                )}
            </div>
        )
    }

    // Date
    if (type === 'date') {
        if (isEditing) {
            return (
                <input
                    ref={inputRef}
                    type="date"
                    value={String(localValue || '')}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={() => onEndEdit(localValue)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white dark:bg-gray-700 border border-potion-500 rounded px-2 py-1 text-sm outline-none"
                />
            )
        }

        return (
            <span
                onClick={onStartEdit}
                className={`text-sm cursor-pointer ${value ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}
            >
                {value ? new Date(String(value)).toLocaleDateString() : 'No date'}
            </span>
        )
    }

    // Number
    if (type === 'number') {
        if (isEditing) {
            return (
                <input
                    ref={inputRef}
                    type="number"
                    value={localValue as number || ''}
                    onChange={(e) => setLocalValue(e.target.value ? Number(e.target.value) : null)}
                    onBlur={() => onEndEdit(localValue)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white dark:bg-gray-700 border border-potion-500 rounded px-2 py-1 text-sm outline-none"
                />
            )
        }

        return (
            <span
                onClick={onStartEdit}
                className={`text-sm cursor-pointer ${value !== null && value !== undefined ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}
            >
                {value !== null && value !== undefined ? String(value) : '—'}
            </span>
        )
    }

    // URL
    if (type === 'url') {
        if (isEditing) {
            return (
                <input
                    ref={inputRef}
                    type="url"
                    value={String(localValue || '')}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={() => onEndEdit(localValue)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://..."
                    className="w-full bg-white dark:bg-gray-700 border border-potion-500 rounded px-2 py-1 text-sm outline-none"
                />
            )
        }

        if (value) {
            return (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-potion-600 dark:text-potion-400 hover:underline truncate block max-w-[200px]"
                >
                    {String(value)}
                </a>
            )
        }

        return (
            <span
                onClick={onStartEdit}
                className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
            >
                Add URL...
            </span>
        )
    }

    // Text (default)
    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={String(localValue || '')}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={() => onEndEdit(localValue)}
                onKeyDown={handleKeyDown}
                className="w-full bg-white dark:bg-gray-700 border border-potion-500 rounded px-2 py-1 text-sm outline-none"
            />
        )
    }

    return (
        <span
            onClick={onStartEdit}
            className={`text-sm cursor-pointer ${value ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}
        >
            {value ? String(value) : 'Empty'}
        </span>
    )
}

// ============================================
// Helper functions for filtering and sorting
// ============================================

/**
 * Check if a value matches a filter condition.
 */
function matchesFilter(value: unknown, filter: Filter): boolean {
    const { operator, value: filterValue } = filter

    // Handle isEmpty/isNotEmpty first
    if (operator === 'isEmpty') {
        return value === null || value === undefined || value === '' ||
            (Array.isArray(value) && value.length === 0)
    }
    if (operator === 'isNotEmpty') {
        return value !== null && value !== undefined && value !== '' &&
            !(Array.isArray(value) && value.length === 0)
    }

    // Handle checkbox (boolean)
    if (typeof value === 'boolean' || typeof filterValue === 'boolean') {
        return operator === 'equals' ? value === filterValue : value !== filterValue
    }

    // Handle arrays (multiSelect)
    if (Array.isArray(value)) {
        if (operator === 'contains') {
            return value.includes(filterValue)
        }
        if (operator === 'notContains') {
            return !value.includes(filterValue)
        }
        return true
    }

    // Handle numbers
    if (typeof value === 'number' && typeof filterValue === 'number') {
        switch (operator) {
            case 'equals': return value === filterValue
            case 'notEquals': return value !== filterValue
            case 'gt': return value > filterValue
            case 'gte': return value >= filterValue
            case 'lt': return value < filterValue
            case 'lte': return value <= filterValue
            default: return true
        }
    }

    // Handle dates (stored as strings)
    if (operator === 'gt' || operator === 'gte' || operator === 'lt' || operator === 'lte') {
        const dateValue = new Date(String(value)).getTime()
        const dateFilter = new Date(String(filterValue)).getTime()
        if (!isNaN(dateValue) && !isNaN(dateFilter)) {
            switch (operator) {
                case 'gt': return dateValue > dateFilter
                case 'gte': return dateValue >= dateFilter
                case 'lt': return dateValue < dateFilter
                case 'lte': return dateValue <= dateFilter
            }
        }
    }

    // Handle strings
    const strValue = String(value || '').toLowerCase()
    const strFilter = String(filterValue || '').toLowerCase()

    switch (operator) {
        case 'equals': return strValue === strFilter
        case 'notEquals': return strValue !== strFilter
        case 'contains': return strValue.includes(strFilter)
        case 'notContains': return !strValue.includes(strFilter)
        default: return true
    }
}

/**
 * Compare two values for sorting.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
function compareValues(a: unknown, b: unknown): number {
    // Handle null/undefined
    if (a == null && b == null) return 0
    if (a == null) return -1
    if (b == null) return 1

    // Handle booleans
    if (typeof a === 'boolean' && typeof b === 'boolean') {
        return a === b ? 0 : (a ? 1 : -1)
    }

    // Handle numbers
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b
    }

    // Handle arrays (by length, then by first element)
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return a.length - b.length
        if (a.length === 0) return 0
        return compareValues(a[0], b[0])
    }

    // Handle dates (stored as strings, try to parse)
    const dateA = new Date(String(a)).getTime()
    const dateB = new Date(String(b)).getTime()
    if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB
    }

    // Default to string comparison
    return String(a).localeCompare(String(b))
}
