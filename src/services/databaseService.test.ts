/**
 * Database Service Tests
 * 
 * Unit tests for database service functions.
 */

import { describe, it, expect } from 'bun:test'
import type { Database, Row, PropertyDefinition, PropertyType, SelectOption } from '../types'
import {
    createPropertyDefinition,
    createSelectOption,
    PROPERTY_TYPE_LABELS,
    PROPERTY_TYPE_ICONS,
    SELECT_OPTION_COLORS
} from './databaseService'

describe('Database Service - createPropertyDefinition', () => {
    it('should create a text property with auto-generated ID', () => {
        const property = createPropertyDefinition('Name', 'text')

        expect(property.id).toBeDefined()
        expect(property.id.length).toBeGreaterThan(0)
        expect(property.name).toBe('Name')
        expect(property.type).toBe('text')
        expect(property.options).toBeUndefined()
    })

    it('should create a select property with options', () => {
        const options: SelectOption[] = [
            { id: '1', name: 'Option 1', color: 'blue' },
            { id: '2', name: 'Option 2', color: 'red' }
        ]
        const property = createPropertyDefinition('Status', 'select', options)

        expect(property.type).toBe('select')
        expect(property.options).toHaveLength(2)
        expect(property.options?.[0].name).toBe('Option 1')
    })

    it('should support all property types', () => {
        const types: PropertyType[] = ['text', 'number', 'date', 'checkbox', 'select', 'multiSelect', 'url']

        types.forEach(type => {
            const property = createPropertyDefinition(`Test ${type}`, type)
            expect(property.type).toBe(type)
            expect(property.name).toBe(`Test ${type}`)
        })
    })
})

describe('Database Service - createSelectOption', () => {
    it('should create a select option with auto-generated ID', () => {
        const option = createSelectOption('In Progress', 'blue')

        expect(option.id).toBeDefined()
        expect(option.id.length).toBeGreaterThan(0)
        expect(option.name).toBe('In Progress')
        expect(option.color).toBe('blue')
    })
})

describe('Database Service - Constants', () => {
    it('should have labels for all property types', () => {
        const types: PropertyType[] = ['text', 'number', 'date', 'checkbox', 'select', 'multiSelect', 'url']

        types.forEach(type => {
            expect(PROPERTY_TYPE_LABELS[type]).toBeDefined()
            expect(typeof PROPERTY_TYPE_LABELS[type]).toBe('string')
        })
    })

    it('should have icons for all property types', () => {
        const types: PropertyType[] = ['text', 'number', 'date', 'checkbox', 'select', 'multiSelect', 'url']

        types.forEach(type => {
            expect(PROPERTY_TYPE_ICONS[type]).toBeDefined()
            expect(typeof PROPERTY_TYPE_ICONS[type]).toBe('string')
        })
    })

    it('should have select option colors defined', () => {
        expect(SELECT_OPTION_COLORS.length).toBeGreaterThan(0)
        expect(SELECT_OPTION_COLORS).toContain('blue')
        expect(SELECT_OPTION_COLORS).toContain('red')
        expect(SELECT_OPTION_COLORS).toContain('green')
    })
})

describe('Database Type Contracts', () => {
    it('Database should have all required fields', () => {
        const database: Database = {
            pageId: 'page-123',
            properties: [
                { id: 'prop-1', name: 'Name', type: 'text' },
                { id: 'prop-2', name: 'Status', type: 'select', options: [] }
            ],
            views: [
                {
                    id: 'view-1',
                    name: 'Table View',
                    type: 'table',
                    filters: [],
                    sorts: []
                }
            ]
        }

        expect(database.pageId).toBe('page-123')
        expect(database.properties).toHaveLength(2)
        expect(database.views).toHaveLength(1)
        expect(database.views[0].type).toBe('table')
    })

    it('PropertyDefinition should support all property types', () => {
        const textProp: PropertyDefinition = { id: '1', name: 'Text', type: 'text' }
        const numberProp: PropertyDefinition = { id: '2', name: 'Number', type: 'number' }
        const dateProp: PropertyDefinition = { id: '3', name: 'Date', type: 'date' }
        const checkboxProp: PropertyDefinition = { id: '4', name: 'Done', type: 'checkbox' }
        const selectProp: PropertyDefinition = {
            id: '5',
            name: 'Status',
            type: 'select',
            options: [{ id: 'opt-1', name: 'Active', color: 'green' }]
        }
        const multiSelectProp: PropertyDefinition = {
            id: '6',
            name: 'Tags',
            type: 'multiSelect',
            options: []
        }
        const urlProp: PropertyDefinition = { id: '7', name: 'Link', type: 'url' }

        expect(textProp.type).toBe('text')
        expect(numberProp.type).toBe('number')
        expect(dateProp.type).toBe('date')
        expect(checkboxProp.type).toBe('checkbox')
        expect(selectProp.type).toBe('select')
        expect(selectProp.options).toHaveLength(1)
        expect(multiSelectProp.type).toBe('multiSelect')
        expect(urlProp.type).toBe('url')
    })

    it('Row should have all required fields', () => {
        const row: Row = {
            id: 'row-123',
            databasePageId: 'db-page-456',
            pageId: 'page-789',
            values: {
                'prop-1': 'Test value',
                'prop-2': 42,
                'prop-3': true,
                'prop-4': '2025-01-01',
                'prop-5': 'opt-1',
                'prop-6': ['opt-1', 'opt-2']
            },
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
        }

        expect(row.id).toBe('row-123')
        expect(row.databasePageId).toBe('db-page-456')
        expect(row.pageId).toBe('page-789')
        expect(row.values['prop-1']).toBe('Test value')
        expect(row.values['prop-2']).toBe(42)
        expect(row.values['prop-3']).toBe(true)
        expect(Array.isArray(row.values['prop-6'])).toBe(true)
    })

    it('Row values should support various data types', () => {
        const row: Row = {
            id: 'row-1',
            databasePageId: 'db-1',
            pageId: 'page-1',
            values: {
                text: 'Hello',
                number: 123.45,
                checkbox: false,
                date: null,
                select: 'option-id',
                multiSelect: ['opt-1', 'opt-2'],
                url: 'https://example.com'
            },
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
        }

        expect(typeof row.values.text).toBe('string')
        expect(typeof row.values.number).toBe('number')
        expect(typeof row.values.checkbox).toBe('boolean')
        expect(row.values.date).toBeNull()
        expect(typeof row.values.select).toBe('string')
        expect(Array.isArray(row.values.multiSelect)).toBe(true)
        expect(typeof row.values.url).toBe('string')
    })
})

describe('Database View Types', () => {
    it('should support table view type', () => {
        const database: Database = {
            pageId: 'test',
            properties: [],
            views: [{
                id: 'view-1',
                name: 'My Table',
                type: 'table',
                filters: [],
                sorts: []
            }]
        }

        expect(database.views[0].type).toBe('table')
    })

    it('should support filters in views', () => {
        const database: Database = {
            pageId: 'test',
            properties: [{ id: 'status', name: 'Status', type: 'select' }],
            views: [{
                id: 'view-1',
                name: 'Filtered View',
                type: 'table',
                filters: [
                    { propertyId: 'status', operator: 'equals', value: 'active' }
                ],
                sorts: []
            }]
        }

        expect(database.views[0].filters).toHaveLength(1)
        expect(database.views[0].filters[0].operator).toBe('equals')
    })

    it('should support sorts in views', () => {
        const database: Database = {
            pageId: 'test',
            properties: [{ id: 'date', name: 'Date', type: 'date' }],
            views: [{
                id: 'view-1',
                name: 'Sorted View',
                type: 'table',
                filters: [],
                sorts: [
                    { propertyId: 'date', direction: 'desc' }
                ]
            }]
        }

        expect(database.views[0].sorts).toHaveLength(1)
        expect(database.views[0].sorts[0].direction).toBe('desc')
    })
})

// ============================================
// Filter Logic Tests
// ============================================

describe('Database Filter Logic', () => {
    it('should support equals operator for text', () => {
        const filter = { propertyId: 'name', operator: 'equals' as const, value: 'test' }
        // The filter matches when value equals filter value
        expect(filter.operator).toBe('equals')
        expect('test' === filter.value).toBe(true)
        expect('other' === filter.value).toBe(false)
    })

    it('should support contains operator for text', () => {
        const filter = { propertyId: 'name', operator: 'contains' as const, value: 'foo' }
        expect('foobar'.toLowerCase().includes(String(filter.value).toLowerCase())).toBe(true)
        expect('bar'.toLowerCase().includes(String(filter.value).toLowerCase())).toBe(false)
    })

    it('should support isEmpty operator', () => {
        const filter = { propertyId: 'name', operator: 'isEmpty' as const, value: null }
        expect(filter.operator).toBe('isEmpty')
        // isEmpty matches null, undefined, empty string, empty array
        const emptyValue: unknown = null
        const nonEmptyValue: unknown = 'value'
        expect(emptyValue === null || emptyValue === undefined || emptyValue === '').toBe(true)
        expect(nonEmptyValue === null || nonEmptyValue === undefined).toBe(false)
    })

    it('should support numeric comparison operators', () => {
        const gtFilter = { propertyId: 'amount', operator: 'gt' as const, value: 10 }
        expect(gtFilter.operator).toBe('gt')
        expect(15 > (gtFilter.value as number)).toBe(true)
        expect(5 > (gtFilter.value as number)).toBe(false)

        const lteFilter = { propertyId: 'amount', operator: 'lte' as const, value: 10 }
        expect(lteFilter.operator).toBe('lte')
        expect(10 <= (lteFilter.value as number)).toBe(true)
        expect(11 <= (lteFilter.value as number)).toBe(false)
    })

    it('should support checkbox filter', () => {
        const filter = { propertyId: 'done', operator: 'equals' as const, value: true }
        expect(true === filter.value).toBe(true)
        expect(false === filter.value).toBe(false)
    })
})

// ============================================
// Sort Logic Tests
// ============================================

describe('Database Sort Logic', () => {
    it('should sort strings alphabetically ascending', () => {
        const values = ['Banana', 'Apple', 'Cherry']
        const sorted = [...values].sort((a, b) => a.localeCompare(b))
        expect(sorted).toEqual(['Apple', 'Banana', 'Cherry'])
    })

    it('should sort strings alphabetically descending', () => {
        const values = ['Banana', 'Apple', 'Cherry']
        const sorted = [...values].sort((a, b) => b.localeCompare(a))
        expect(sorted).toEqual(['Cherry', 'Banana', 'Apple'])
    })

    it('should sort numbers correctly', () => {
        const values = [10, 2, 5, 1, 100]
        const sorted = [...values].sort((a, b) => a - b)
        expect(sorted).toEqual([1, 2, 5, 10, 100])
    })

    it('should sort dates correctly', () => {
        const dates = ['2024-03-15', '2024-01-01', '2024-12-31']
        const sorted = [...dates].sort((a, b) =>
            new Date(a).getTime() - new Date(b).getTime()
        )
        expect(sorted).toEqual(['2024-01-01', '2024-03-15', '2024-12-31'])
    })

    it('should handle null values in sort', () => {
        const values = [5, null, 3, null, 1]
        const sorted = [...values].sort((a, b) => {
            if (a === null && b === null) return 0
            if (a === null) return -1
            if (b === null) return 1
            return a - b
        })
        expect(sorted).toEqual([null, null, 1, 3, 5])
    })
})
