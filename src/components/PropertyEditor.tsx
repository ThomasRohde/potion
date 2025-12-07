/**
 * PropertyEditor Component
 * 
 * Component for editing database property schema.
 * Allows adding, removing, and modifying property definitions.
 */

import { useState, useCallback } from 'react'
import { Plus, SlidersHorizontal, ChevronUp, ChevronDown, Trash2, X } from 'lucide-react'
import type { PropertyDefinition, PropertyType, SelectOption } from '../types'
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, SELECT_OPTION_COLORS, createSelectOption } from '../services'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface PropertyEditorProps {
    properties: PropertyDefinition[]
    onChange: (properties: PropertyDefinition[]) => void
    readOnly?: boolean
}

export function PropertyEditor({ properties, onChange, readOnly = false }: PropertyEditorProps) {
    const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null)
    const [showAddMenu, setShowAddMenu] = useState(false)

    const handleAddProperty = useCallback((type: PropertyType) => {
        const newProperty: PropertyDefinition = {
            id: crypto.randomUUID(),
            name: `New ${PROPERTY_TYPE_LABELS[type]}`,
            type,
            ...(type === 'select' || type === 'multiSelect' ? { options: [] } : {})
        }
        onChange([...properties, newProperty])
        setEditingPropertyId(newProperty.id)
        setShowAddMenu(false)
    }, [properties, onChange])

    const handleUpdateProperty = useCallback((propertyId: string, updates: Partial<PropertyDefinition>) => {
        onChange(properties.map(p =>
            p.id === propertyId ? { ...p, ...updates } : p
        ))
    }, [properties, onChange])

    const handleDeleteProperty = useCallback((propertyId: string) => {
        onChange(properties.filter(p => p.id !== propertyId))
        if (editingPropertyId === propertyId) {
            setEditingPropertyId(null)
        }
    }, [properties, onChange, editingPropertyId])

    const handleMoveProperty = useCallback((propertyId: string, direction: 'up' | 'down') => {
        const index = properties.findIndex(p => p.id === propertyId)
        if (index === -1) return

        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= properties.length) return

        const newProperties = [...properties]
            ;[newProperties[index], newProperties[newIndex]] = [newProperties[newIndex], newProperties[index]]
        onChange(newProperties)
    }, [properties, onChange])

    if (readOnly) {
        return (
            <div className="space-y-2">
                {properties.map(property => (
                    <PropertyRow key={property.id} property={property} readOnly />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {properties.map((property, index) => (
                <PropertyRow
                    key={property.id}
                    property={property}
                    isEditing={editingPropertyId === property.id}
                    onEdit={() => setEditingPropertyId(property.id)}
                    onStopEditing={() => setEditingPropertyId(null)}
                    onUpdate={(updates) => handleUpdateProperty(property.id, updates)}
                    onDelete={() => handleDeleteProperty(property.id)}
                    onMoveUp={index > 0 ? () => handleMoveProperty(property.id, 'up') : undefined}
                    onMoveDown={index < properties.length - 1 ? () => handleMoveProperty(property.id, 'down') : undefined}
                />
            ))}

            {/* Add Property Button */}
            <div className="relative">
                <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add property
                </button>

                {/* Property Type Menu */}
                {showAddMenu && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                        {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => handleAddProperty(type)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span className="w-6 text-center text-gray-500">{PROPERTY_TYPE_ICONS[type]}</span>
                                {PROPERTY_TYPE_LABELS[type]}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

interface PropertyRowProps {
    property: PropertyDefinition
    isEditing?: boolean
    readOnly?: boolean
    onEdit?: () => void
    onStopEditing?: () => void
    onUpdate?: (updates: Partial<PropertyDefinition>) => void
    onDelete?: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}

function PropertyRow({
    property,
    isEditing = false,
    readOnly = false,
    onEdit,
    onStopEditing,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown
}: PropertyRowProps) {
    const [showTypeMenu, setShowTypeMenu] = useState(false)
    const [showOptionsEditor, setShowOptionsEditor] = useState(false)

    const hasOptions = property.type === 'select' || property.type === 'multiSelect'

    if (readOnly) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="w-6 text-center text-gray-500">{PROPERTY_TYPE_ICONS[property.type]}</span>
                <span className="text-gray-700 dark:text-gray-300">{property.name}</span>
                <span className="ml-auto text-gray-400 text-xs">{PROPERTY_TYPE_LABELS[property.type]}</span>
            </div>
        )
    }

    return (
        <div className="group">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                {/* Drag handle / Type icon */}
                <span className="w-6 text-center text-gray-500 cursor-grab">{PROPERTY_TYPE_ICONS[property.type]}</span>

                {/* Property name */}
                {isEditing ? (
                    <Input
                        type="text"
                        value={property.name}
                        onChange={(e) => onUpdate?.({ name: e.target.value })}
                        onBlur={onStopEditing}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                                onStopEditing?.()
                            }
                        }}
                        className="flex-1 h-auto py-0.5"
                        autoFocus
                    />
                ) : (
                    <span
                        onClick={onEdit}
                        className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    >
                        {property.name}
                    </span>
                )}

                {/* Type selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowTypeMenu(!showTypeMenu)}
                        className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                        {PROPERTY_TYPE_LABELS[property.type]}
                    </button>

                    {showTypeMenu && (
                        <div className="absolute right-0 top-full z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[150px]">
                            {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        onUpdate?.({ type, ...(type === 'select' || type === 'multiSelect' ? { options: [] } : {}) })
                                        setShowTypeMenu(false)
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${type === property.type
                                        ? 'bg-potion-100 dark:bg-potion-900/30 text-potion-700 dark:text-potion-300'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <span className="w-5 text-center">{PROPERTY_TYPE_ICONS[type]}</span>
                                    {PROPERTY_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Options button for select types */}
                {hasOptions && (
                    <button
                        onClick={() => setShowOptionsEditor(!showOptionsEditor)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        title="Edit options"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                )}

                {/* Move buttons */}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {onMoveUp && (
                        <button
                            onClick={onMoveUp}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            title="Move up"
                        >
                            <ChevronUp className="w-3 h-3" />
                        </button>
                    )}
                    {onMoveDown && (
                        <button
                            onClick={onMoveDown}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            title="Move down"
                        >
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Delete button */}
                <button
                    onClick={onDelete}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete property"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Options Editor */}
            {showOptionsEditor && hasOptions && (
                <div className="mt-2 ml-8 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <SelectOptionsEditor
                        options={property.options || []}
                        onChange={(options) => onUpdate?.({ options })}
                    />
                </div>
            )}
        </div>
    )
}

interface SelectOptionsEditorProps {
    options: SelectOption[]
    onChange: (options: SelectOption[]) => void
}

function SelectOptionsEditor({ options, onChange }: SelectOptionsEditorProps) {
    const [newOptionName, setNewOptionName] = useState('')

    const handleAddOption = () => {
        if (!newOptionName.trim()) return
        const color = SELECT_OPTION_COLORS[options.length % SELECT_OPTION_COLORS.length]
        const newOption = createSelectOption(newOptionName.trim(), color)
        onChange([...options, newOption])
        setNewOptionName('')
    }

    const handleUpdateOption = (optionId: string, updates: Partial<SelectOption>) => {
        onChange(options.map(o => o.id === optionId ? { ...o, ...updates } : o))
    }

    const handleDeleteOption = (optionId: string) => {
        onChange(options.filter(o => o.id !== optionId))
    }

    return (
        <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Options</div>

            {options.map(option => (
                <div key={option.id} className="flex items-center gap-2">
                    <Select
                        value={option.color}
                        onValueChange={(value) => handleUpdateOption(option.id, { color: value })}
                    >
                        <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SELECT_OPTION_COLORS.map(color => (
                                <SelectItem key={color} value={color} className="text-xs">
                                    {color}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="text"
                        value={option.name}
                        onChange={(e) => handleUpdateOption(option.id, { name: e.target.value })}
                        className="flex-1 h-8"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteOption(option.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ))}

            {/* Add new option */}
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleAddOption()
                        }
                    }}
                    placeholder="Add option..."
                    className="flex-1 h-8"
                />
                <Button
                    onClick={handleAddOption}
                    disabled={!newOptionName.trim()}
                    size="sm"
                >
                    Add
                </Button>
            </div>
        </div>
    )
}

/**
 * Get Tailwind class for select option color.
 */
export function getSelectOptionColorClass(color: string): { bg: string; text: string } {
    const colorMap: Record<string, { bg: string; text: string }> = {
        gray: { bg: 'bg-gray-200 dark:bg-gray-600', text: 'text-gray-800 dark:text-gray-200' },
        brown: { bg: 'bg-amber-200 dark:bg-amber-800', text: 'text-amber-900 dark:text-amber-100' },
        orange: { bg: 'bg-orange-200 dark:bg-orange-800', text: 'text-orange-900 dark:text-orange-100' },
        yellow: { bg: 'bg-yellow-200 dark:bg-yellow-800', text: 'text-yellow-900 dark:text-yellow-100' },
        green: { bg: 'bg-green-200 dark:bg-green-800', text: 'text-green-900 dark:text-green-100' },
        blue: { bg: 'bg-blue-200 dark:bg-blue-800', text: 'text-blue-900 dark:text-blue-100' },
        purple: { bg: 'bg-purple-200 dark:bg-purple-800', text: 'text-purple-900 dark:text-purple-100' },
        pink: { bg: 'bg-pink-200 dark:bg-pink-800', text: 'text-pink-900 dark:text-pink-100' },
        red: { bg: 'bg-red-200 dark:bg-red-800', text: 'text-red-900 dark:text-red-100' }
    }
    return colorMap[color] || colorMap.gray
}
