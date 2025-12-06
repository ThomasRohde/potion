/**
 * Database Service
 * 
 * High-level API for database operations.
 * Wraps StorageAdapter methods with business logic.
 */

import { v4 as uuidv4 } from 'uuid'
import { getStorage } from '../storage'
import { createPage } from './pageService'
import type { Database, Page, PropertyDefinition, DatabaseView, Row, RowSummary, PropertyType, SelectOption } from '../types'

/**
 * Create a new database page with initial schema.
 */
export async function createDatabase(
    workspaceId: string,
    title: string,
    options: {
        parentPageId?: string | null
        icon?: string
        initialProperties?: PropertyDefinition[]
    } = {}
): Promise<{ page: Page; database: Database }> {
    const storage = await getStorage()

    // Create the page with type 'database'
    const page = await createPage(workspaceId, title, {
        parentPageId: options.parentPageId,
        type: 'database',
        icon: options.icon ?? '📊'
    })

    // Create default properties if none provided
    const properties: PropertyDefinition[] = options.initialProperties ?? [
        createPropertyDefinition('Name', 'text'),
        createPropertyDefinition('Tags', 'select')
    ]

    // Create default table view
    const defaultView: DatabaseView = {
        id: uuidv4(),
        name: 'Table View',
        type: 'table',
        filters: [],
        sorts: []
    }

    const database: Database = {
        pageId: page.id,
        properties,
        views: [defaultView]
    }

    await storage.upsertDatabase(database)

    return { page, database }
}

/**
 * Create a property definition with an auto-generated ID.
 */
export function createPropertyDefinition(
    name: string,
    type: PropertyType,
    options?: SelectOption[]
): PropertyDefinition {
    return {
        id: uuidv4(),
        name,
        type,
        ...(options ? { options } : {})
    }
}

/**
 * Create a select option with an auto-generated ID.
 */
export function createSelectOption(name: string, color: string): SelectOption {
    return {
        id: uuidv4(),
        name,
        color
    }
}

/**
 * Get a database by its page ID.
 */
export async function getDatabase(pageId: string): Promise<Database | null> {
    const storage = await getStorage()
    return storage.getDatabase(pageId)
}

/**
 * Update database properties (schema).
 */
export async function updateDatabaseProperties(
    pageId: string,
    properties: PropertyDefinition[]
): Promise<Database> {
    const storage = await getStorage()
    const database = await storage.getDatabase(pageId)

    if (!database) {
        throw new Error(`Database not found: ${pageId}`)
    }

    const updated: Database = {
        ...database,
        properties
    }

    await storage.upsertDatabase(updated)
    return updated
}

/**
 * Add a property to a database.
 */
export async function addDatabaseProperty(
    pageId: string,
    name: string,
    type: PropertyType,
    options?: SelectOption[]
): Promise<{ database: Database; property: PropertyDefinition }> {
    const storage = await getStorage()
    const database = await storage.getDatabase(pageId)

    if (!database) {
        throw new Error(`Database not found: ${pageId}`)
    }

    const property = createPropertyDefinition(name, type, options)

    const updated: Database = {
        ...database,
        properties: [...database.properties, property]
    }

    await storage.upsertDatabase(updated)
    return { database: updated, property }
}

/**
 * Update a property in a database.
 */
export async function updateDatabaseProperty(
    pageId: string,
    propertyId: string,
    updates: Partial<Pick<PropertyDefinition, 'name' | 'type' | 'options'>>
): Promise<Database> {
    const storage = await getStorage()
    const database = await storage.getDatabase(pageId)

    if (!database) {
        throw new Error(`Database not found: ${pageId}`)
    }

    const propertyIndex = database.properties.findIndex(p => p.id === propertyId)
    if (propertyIndex === -1) {
        throw new Error(`Property not found: ${propertyId}`)
    }

    const updatedProperties = [...database.properties]
    updatedProperties[propertyIndex] = {
        ...updatedProperties[propertyIndex],
        ...updates
    }

    const updated: Database = {
        ...database,
        properties: updatedProperties
    }

    await storage.upsertDatabase(updated)
    return updated
}

/**
 * Remove a property from a database.
 */
export async function removeDatabaseProperty(
    pageId: string,
    propertyId: string
): Promise<Database> {
    const storage = await getStorage()
    const database = await storage.getDatabase(pageId)

    if (!database) {
        throw new Error(`Database not found: ${pageId}`)
    }

    const updated: Database = {
        ...database,
        properties: database.properties.filter(p => p.id !== propertyId)
    }

    await storage.upsertDatabase(updated)
    return updated
}

/**
 * Update database views.
 */
export async function updateDatabaseViews(
    pageId: string,
    views: DatabaseView[]
): Promise<Database> {
    const storage = await getStorage()
    const database = await storage.getDatabase(pageId)

    if (!database) {
        throw new Error(`Database not found: ${pageId}`)
    }

    const updated: Database = {
        ...database,
        views
    }

    await storage.upsertDatabase(updated)
    return updated
}

/**
 * Delete a database and its associated page.
 */
export async function deleteDatabase(pageId: string): Promise<void> {
    const storage = await getStorage()
    await storage.deleteDatabase(pageId)
    await storage.deletePage(pageId)
}

// ============================================
// Row Operations
// ============================================

/**
 * Create a new row in a database.
 */
export async function createRow(
    databasePageId: string,
    workspaceId: string,
    initialValues: Record<string, unknown> = {}
): Promise<Row> {
    const storage = await getStorage()

    // Get database to access properties
    const database = await storage.getDatabase(databasePageId)
    if (!database) {
        throw new Error(`Database not found: ${databasePageId}`)
    }

    // Create a page for this row
    const page = await createPage(workspaceId, 'Untitled', {
        parentPageId: databasePageId,
        type: 'page'
    })

    const now = new Date().toISOString()

    // Initialize values for all properties
    const values: Record<string, unknown> = {}
    for (const prop of database.properties) {
        if (prop.id in initialValues) {
            values[prop.id] = initialValues[prop.id]
        } else {
            // Set default values based on type
            values[prop.id] = getDefaultValueForType(prop.type)
        }
    }

    const row: Row = {
        id: uuidv4(),
        databasePageId,
        pageId: page.id,
        values,
        createdAt: now,
        updatedAt: now
    }

    await storage.upsertRow(row)
    return row
}

/**
 * Get default value for a property type.
 */
function getDefaultValueForType(type: PropertyType): unknown {
    switch (type) {
        case 'text':
        case 'url':
            return ''
        case 'number':
            return null
        case 'date':
            return null
        case 'checkbox':
            return false
        case 'select':
            return null
        case 'multiSelect':
            return []
        default:
            return null
    }
}

/**
 * Get a row by ID.
 */
export async function getRow(rowId: string): Promise<Row | null> {
    const storage = await getStorage()
    return storage.getRow(rowId)
}

/**
 * List all rows in a database.
 */
export async function listRows(databasePageId: string): Promise<RowSummary[]> {
    const storage = await getStorage()
    return storage.listRows(databasePageId)
}

/**
 * Get all rows with full data.
 */
export async function getFullRows(databasePageId: string): Promise<Row[]> {
    const storage = await getStorage()
    const summaries = await storage.listRows(databasePageId)
    const rows: Row[] = []

    for (const summary of summaries) {
        const row = await storage.getRow(summary.id)
        if (row) {
            rows.push(row)
        }
    }

    return rows
}

/**
 * Update a row's values.
 */
export async function updateRowValues(
    rowId: string,
    values: Record<string, unknown>
): Promise<Row> {
    const storage = await getStorage()
    const row = await storage.getRow(rowId)

    if (!row) {
        throw new Error(`Row not found: ${rowId}`)
    }

    const updated: Row = {
        ...row,
        values: { ...row.values, ...values },
        updatedAt: new Date().toISOString()
    }

    await storage.upsertRow(updated)
    return updated
}

/**
 * Update a single row value.
 */
export async function updateRowValue(
    rowId: string,
    propertyId: string,
    value: unknown
): Promise<Row> {
    return updateRowValues(rowId, { [propertyId]: value })
}

/**
 * Update the title of a row's associated page.
 */
export async function updateRowTitle(rowId: string, title: string): Promise<void> {
    const storage = await getStorage()
    const row = await storage.getRow(rowId)

    if (!row) {
        throw new Error(`Row not found: ${rowId}`)
    }

    const page = await storage.getPage(row.pageId)
    if (page) {
        await storage.upsertPage({
            ...page,
            title,
            updatedAt: new Date().toISOString()
        })
    }
}

/**
 * Delete a row and its associated page.
 */
export async function deleteRow(rowId: string): Promise<void> {
    const storage = await getStorage()
    const row = await storage.getRow(rowId)

    if (row) {
        // Delete the associated page
        await storage.deletePage(row.pageId)
    }

    // Delete the row
    await storage.deleteRow(rowId)
}

/**
 * Property type display names.
 */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    checkbox: 'Checkbox',
    select: 'Select',
    multiSelect: 'Multi-select',
    url: 'URL'
}

/**
 * Property type icons.
 */
export const PROPERTY_TYPE_ICONS: Record<PropertyType, string> = {
    text: 'Aa',
    number: '#',
    date: '📅',
    checkbox: '☑',
    select: '▼',
    multiSelect: '☰',
    url: '🔗'
}

/**
 * Default colors for select options.
 */
export const SELECT_OPTION_COLORS = [
    'gray',
    'brown',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'pink',
    'red'
] as const

export type SelectOptionColor = typeof SELECT_OPTION_COLORS[number]
