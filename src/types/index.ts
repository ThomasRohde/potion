/**
 * Core data types for Potion workspace
 */

// ============================================
// Workspace
// ============================================

export interface Workspace {
    id: string
    name: string
    createdAt: string // ISO 8601
    updatedAt: string // ISO 8601
    version: number   // Schema version for migrations
}

// ============================================
// Page
// ============================================

export type PageType = 'page' | 'database'

export interface Page {
    id: string
    workspaceId: string
    parentPageId: string | null
    title: string
    type: PageType
    isFavorite: boolean
    content: BlockContent // Editor document JSON
    createdAt: string
    updatedAt: string
    icon?: string // Emoji or icon identifier
    coverImage?: string // Base64 or URL
}

export interface PageSummary {
    id: string
    workspaceId: string
    parentPageId: string | null
    title: string
    type: PageType
    isFavorite: boolean
    icon?: string
    createdAt: string
    updatedAt: string
}

// ============================================
// Block Content (Editor-agnostic format)
// ============================================

export type BlockType =
    | 'paragraph'
    | 'heading'
    | 'bulletListItem'
    | 'numberedListItem'
    | 'checkListItem'
    | 'quote'
    | 'callout'
    | 'codeBlock'
    | 'divider'
    | 'image'
    | 'table'

export interface InlineStyle {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strikethrough?: boolean
    code?: boolean
}

export interface InlineContent {
    type: 'text' | 'link'
    text: string
    styles?: InlineStyle
    href?: string // For links
}

export interface Block {
    id: string
    type: BlockType
    content: InlineContent[]
    props?: Record<string, unknown> // Type-specific properties
    children?: Block[]
}

export interface BlockContent {
    version: number // Schema version for block format
    blocks: Block[]
}

// ============================================
// Database & Properties
// ============================================

export type PropertyType =
    | 'text'
    | 'number'
    | 'date'
    | 'checkbox'
    | 'select'
    | 'multiSelect'
    | 'url'

export interface SelectOption {
    id: string
    name: string
    color: string
}

export interface PropertyDefinition {
    id: string
    name: string
    type: PropertyType
    options?: SelectOption[] // For select/multiSelect
}

export interface DatabaseView {
    id: string
    name: string
    type: 'table' | 'list'
    filters: Filter[]
    sorts: Sort[]
}

export interface Filter {
    propertyId: string
    operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'gt' | 'gte' | 'lt' | 'lte'
    value: unknown
}

export interface Sort {
    propertyId: string
    direction: 'asc' | 'desc'
}

export interface Database {
    pageId: string // Reference to the page with type='database'
    properties: PropertyDefinition[]
    views: DatabaseView[]
}

// ============================================
// Database Row
// ============================================

export interface Row {
    id: string
    databasePageId: string
    pageId: string // Each row is also a page
    values: Record<string, unknown> // Property ID -> value
    createdAt: string
    updatedAt: string
}

export interface RowSummary {
    id: string
    databasePageId: string
    pageId: string
    title: string
    createdAt: string
    updatedAt: string
}

// ============================================
// Settings
// ============================================

export type ThemePreference = 'light' | 'dark' | 'system'

export interface Settings {
    id: string // Usually 'default' or workspace ID
    theme: ThemePreference
    fontSize: number
    editorWidth: 'narrow' | 'medium' | 'wide' | 'full'
    sidebarCollapsed: boolean
}

// ============================================
// Export / Import
// ============================================

export interface WorkspaceExport {
    version: number
    exportedAt: string
    workspace: Workspace
    pages: Page[]
    databases: Database[]
    rows: Row[]
    settings: Settings | null
}

export interface ImportConflict {
    type: 'page' | 'row'
    id: string
    localUpdatedAt: string
    importedUpdatedAt: string
    localTitle: string
    importedTitle: string
}

export interface ImportResult {
    success: boolean
    pagesAdded: number
    pagesUpdated: number
    rowsAdded: number
    rowsUpdated: number
    conflicts: ImportConflict[]
    errors: string[]
}
