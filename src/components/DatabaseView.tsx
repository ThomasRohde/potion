/**
 * DatabaseView Component
 * 
 * Displays database content in a table view with inline editing.
 * Supports filtering, sorting, and adding new rows.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { Database, Row, PropertyDefinition, PropertyType, SelectOption } from '../types'
import { PROPERTY_TYPE_ICONS, updateRowValue, updateRowTitle, createRow, deleteRow as deleteRowService, getPage } from '../services'
import { getSelectOptionColorClass } from './PropertyEditor'

interface DatabaseViewProps {
    database: Database
    rows: Row[]
    workspaceId: string
    onRowsChange: () => void
    onOpenRow: (rowId: string, pageId: string) => void
    onPropertiesChange: (properties: PropertyDefinition[]) => void
}

export function DatabaseView({
    database,
    rows,
    workspaceId,
    onRowsChange,
    onOpenRow,
    onPropertiesChange
}: DatabaseViewProps) {
    const [rowTitles, setRowTitles] = useState<Record<string, string>>({})
    const [editingCell, setEditingCell] = useState<{ rowId: string; propertyId: string } | null>(null)
    const [isAddingRow, setIsAddingRow] = useState(false)

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

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        {/* Title column */}
                        <th className="text-left px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 min-w-[200px]">
                            <div className="flex items-center gap-2">
                                <span>📝</span>
                                Title
                            </div>
                        </th>
                        {/* Property columns */}
                        {database.properties.map(property => (
                            <PropertyHeader
                                key={property.id}
                                property={property}
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
                    {rows.map(row => (
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
    )
}

interface PropertyHeaderProps {
    property: PropertyDefinition
    onUpdate: (updates: Partial<PropertyDefinition>) => void
    onDelete: () => void
}

function PropertyHeader({ property, onUpdate, onDelete }: PropertyHeaderProps) {
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
                <span className="text-gray-400">{PROPERTY_TYPE_ICONS[property.type]}</span>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={property.name}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                                setIsEditing(false)
                            }
                        }}
                        className="flex-1 bg-white dark:bg-gray-700 border border-potion-500 rounded px-1 py-0.5 text-sm font-normal outline-none"
                    />
                ) : (
                    <span
                        onClick={() => setIsEditing(true)}
                        className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        {property.name}
                    </span>
                )}
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
