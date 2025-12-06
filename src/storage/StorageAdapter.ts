/**
 * StorageAdapter Interface
 * 
 * Abstract interface for workspace storage operations.
 * All UI code should depend on this interface, not on specific
 * storage implementations (IndexedDB, etc.).
 * 
 * This enables:
 * - Swapping storage backends without changing UI code
 * - Testing with mock implementations
 * - Future support for file-based or cloud storage
 */

import type {
    Workspace,
    Page,
    PageSummary,
    Database,
    Row,
    RowSummary,
    Settings,
    WorkspaceExport,
    ImportResult
} from '../types'

export interface StorageAdapter {
    // ============================================
    // Lifecycle
    // ============================================

    /**
     * Initialize the storage backend.
     * Must be called before any other operations.
     * Handles database creation, schema migrations, etc.
     */
    init(): Promise<void>

    /**
     * Close the storage connection and cleanup resources.
     */
    close(): Promise<void>

    // ============================================
    // Workspace Operations
    // ============================================

    /**
     * Get workspace by ID.
     * Returns null if workspace doesn't exist.
     */
    getWorkspace(id: string): Promise<Workspace | null>

    /**
     * List all workspaces (typically just one for single-user app).
     */
    listWorkspaces(): Promise<Workspace[]>

    /**
     * Create or update a workspace.
     */
    upsertWorkspace(workspace: Workspace): Promise<void>

    /**
     * Delete a workspace and all its contents.
     * This is destructive - use with caution.
     */
    deleteWorkspace(id: string): Promise<void>

    // ============================================
    // Page Operations
    // ============================================

    /**
     * List all pages in a workspace (summary only, no content).
     * Useful for building page tree in sidebar.
     */
    listPages(workspaceId: string): Promise<PageSummary[]>

    /**
     * Get a full page including content.
     */
    getPage(pageId: string): Promise<Page | null>

    /**
     * Create or update a page.
     */
    upsertPage(page: Page): Promise<void>

    /**
     * Delete a page.
     * Note: Caller should handle child pages (delete or move them).
     */
    deletePage(pageId: string): Promise<void>

    /**
     * Get all child pages of a parent page.
     */
    getChildPages(parentPageId: string): Promise<PageSummary[]>

    /**
     * Search pages by title and optionally content.
     */
    searchPages(workspaceId: string, query: string): Promise<PageSummary[]>

    // ============================================
    // Database Operations
    // ============================================

    /**
     * Get database definition for a database page.
     */
    getDatabase(pageId: string): Promise<Database | null>

    /**
     * Create or update database definition.
     */
    upsertDatabase(database: Database): Promise<void>

    /**
     * Delete database definition.
     * Note: The page itself should be deleted separately.
     */
    deleteDatabase(pageId: string): Promise<void>

    // ============================================
    // Row Operations
    // ============================================

    /**
     * List all rows in a database.
     */
    listRows(databasePageId: string): Promise<RowSummary[]>

    /**
     * Get a full row including all values.
     */
    getRow(rowId: string): Promise<Row | null>

    /**
     * Create or update a row.
     */
    upsertRow(row: Row): Promise<void>

    /**
     * Delete a row.
     * Note: The associated page should also be deleted.
     */
    deleteRow(rowId: string): Promise<void>

    // ============================================
    // Settings Operations
    // ============================================

    /**
     * Get settings by ID (usually 'default').
     */
    getSettings(id: string): Promise<Settings | null>

    /**
     * Create or update settings.
     */
    upsertSettings(settings: Settings): Promise<void>

    // ============================================
    // Export / Import Operations
    // ============================================

    /**
     * Export entire workspace to portable format.
     */
    exportWorkspace(workspaceId: string): Promise<WorkspaceExport>

    /**
     * Export a single page (and optionally its children).
     */
    exportPage(pageId: string, includeChildren: boolean): Promise<WorkspaceExport>

    /**
     * Export a database with all its rows.
     */
    exportDatabase(databasePageId: string): Promise<WorkspaceExport>

    /**
     * Import workspace data.
     * @param workspaceId - Target workspace ID (null to create new)
     * @param data - The exported workspace data
     * @param mode - 'replace' clears existing data, 'merge' combines with existing
     */
    importWorkspace(
        workspaceId: string | null,
        data: WorkspaceExport,
        mode: 'replace' | 'merge'
    ): Promise<ImportResult>

    // ============================================
    // Utility Operations
    // ============================================

    /**
     * Get storage statistics (for debugging/info).
     */
    getStats(): Promise<{
        workspaceCount: number
        pageCount: number
        databaseCount: number
        rowCount: number
        estimatedSizeBytes: number
    }>

    /**
     * Clear all data (use with caution!).
     */
    clearAll(): Promise<void>
}
