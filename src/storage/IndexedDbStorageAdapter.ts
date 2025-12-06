/**
 * IndexedDB Storage Adapter
 * 
 * Implementation of StorageAdapter using IndexedDB for local persistence.
 * Uses the 'idb' library for a cleaner async/await API.
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { StorageAdapter } from './StorageAdapter'
import type {
    Workspace,
    Page,
    PageSummary,
    Database,
    Row,
    RowSummary,
    Settings,
    WorkspaceExport,
    ImportResult,
    ImportConflict
} from '../types'

const DB_NAME = 'potion-db'
const DB_VERSION = 1

// Store names
const STORES = {
    WORKSPACES: 'workspaces',
    PAGES: 'pages',
    DATABASES: 'databases',
    ROWS: 'rows',
    SETTINGS: 'settings'
} as const

type PotionDB = IDBPDatabase<unknown>

export class IndexedDbStorageAdapter implements StorageAdapter {
    private db: PotionDB | null = null

    async init(): Promise<void> {
        this.db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Workspaces store
                if (!db.objectStoreNames.contains(STORES.WORKSPACES)) {
                    db.createObjectStore(STORES.WORKSPACES, { keyPath: 'id' })
                }

                // Pages store with indexes
                if (!db.objectStoreNames.contains(STORES.PAGES)) {
                    const pageStore = db.createObjectStore(STORES.PAGES, { keyPath: 'id' })
                    pageStore.createIndex('by-workspace', 'workspaceId')
                    pageStore.createIndex('by-parent', 'parentPageId')
                    pageStore.createIndex('by-type', 'type')
                }

                // Databases store (keyed by pageId)
                if (!db.objectStoreNames.contains(STORES.DATABASES)) {
                    db.createObjectStore(STORES.DATABASES, { keyPath: 'pageId' })
                }

                // Rows store with index
                if (!db.objectStoreNames.contains(STORES.ROWS)) {
                    const rowStore = db.createObjectStore(STORES.ROWS, { keyPath: 'id' })
                    rowStore.createIndex('by-database', 'databasePageId')
                }

                // Settings store
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' })
                }
            }
        })
    }

    async close(): Promise<void> {
        if (this.db) {
            this.db.close()
            this.db = null
        }
    }

    private ensureDb(): PotionDB {
        if (!this.db) {
            throw new Error('Database not initialized. Call init() first.')
        }
        return this.db
    }

    // ============================================
    // Workspace Operations
    // ============================================

    async getWorkspace(id: string): Promise<Workspace | null> {
        const db = this.ensureDb()
        const workspace = await db.get(STORES.WORKSPACES, id)
        return workspace as Workspace | null
    }

    async listWorkspaces(): Promise<Workspace[]> {
        const db = this.ensureDb()
        const workspaces = await db.getAll(STORES.WORKSPACES)
        return workspaces as Workspace[]
    }

    async upsertWorkspace(workspace: Workspace): Promise<void> {
        const db = this.ensureDb()
        await db.put(STORES.WORKSPACES, workspace)
    }

    async deleteWorkspace(id: string): Promise<void> {
        const db = this.ensureDb()
        const tx = db.transaction([STORES.WORKSPACES, STORES.PAGES, STORES.DATABASES, STORES.ROWS], 'readwrite')

        // Delete all pages in workspace
        const pages = await tx.objectStore(STORES.PAGES).index('by-workspace').getAll(id)
        for (const page of pages) {
            await tx.objectStore(STORES.PAGES).delete((page as Page).id)
            // Delete associated database if exists
            await tx.objectStore(STORES.DATABASES).delete((page as Page).id)
            // Delete rows if it's a database page
            const rows = await tx.objectStore(STORES.ROWS).index('by-database').getAll((page as Page).id)
            for (const row of rows) {
                await tx.objectStore(STORES.ROWS).delete((row as Row).id)
            }
        }

        // Delete workspace itself
        await tx.objectStore(STORES.WORKSPACES).delete(id)
        await tx.done
    }

    // ============================================
    // Page Operations
    // ============================================

    async listPages(workspaceId: string): Promise<PageSummary[]> {
        const db = this.ensureDb()
        const pages = await db.getAllFromIndex(STORES.PAGES, 'by-workspace', workspaceId)
        return (pages as Page[]).map(this.toPageSummary)
    }

    async getPage(pageId: string): Promise<Page | null> {
        const db = this.ensureDb()
        const page = await db.get(STORES.PAGES, pageId)
        return page as Page | null
    }

    async upsertPage(page: Page): Promise<void> {
        const db = this.ensureDb()
        await db.put(STORES.PAGES, page)
    }

    async deletePage(pageId: string): Promise<void> {
        const db = this.ensureDb()
        await db.delete(STORES.PAGES, pageId)
    }

    async getChildPages(parentPageId: string): Promise<PageSummary[]> {
        const db = this.ensureDb()
        const pages = await db.getAllFromIndex(STORES.PAGES, 'by-parent', parentPageId)
        return (pages as Page[]).map(this.toPageSummary)
    }

    async searchPages(workspaceId: string, query: string): Promise<PageSummary[]> {
        const db = this.ensureDb()
        const allPages = await db.getAllFromIndex(STORES.PAGES, 'by-workspace', workspaceId)
        const lowerQuery = query.toLowerCase()

        return (allPages as Page[])
            .filter(page => {
                // Search in title
                if (page.title.toLowerCase().includes(lowerQuery)) {
                    return true
                }
                // Search in content (basic text extraction from blocks)
                if (page.content?.blocks) {
                    const textContent = this.extractTextFromBlocks(page.content.blocks)
                    if (textContent.toLowerCase().includes(lowerQuery)) {
                        return true
                    }
                }
                return false
            })
            .map(this.toPageSummary)
    }

    private extractTextFromBlocks(blocks: Page['content']['blocks']): string {
        let text = ''
        for (const block of blocks) {
            if (block.content) {
                for (const inline of block.content) {
                    text += inline.text + ' '
                }
            }
            if (block.children) {
                text += this.extractTextFromBlocks(block.children)
            }
        }
        return text
    }

    private toPageSummary(page: Page): PageSummary {
        return {
            id: page.id,
            workspaceId: page.workspaceId,
            parentPageId: page.parentPageId,
            title: page.title,
            type: page.type,
            isFavorite: page.isFavorite,
            isFullWidth: page.isFullWidth,
            icon: page.icon,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt
        }
    }

    // ============================================
    // Database Operations
    // ============================================

    async getDatabase(pageId: string): Promise<Database | null> {
        const db = this.ensureDb()
        const database = await db.get(STORES.DATABASES, pageId)
        return database as Database | null
    }

    async upsertDatabase(database: Database): Promise<void> {
        const db = this.ensureDb()
        await db.put(STORES.DATABASES, database)
    }

    async deleteDatabase(pageId: string): Promise<void> {
        const db = this.ensureDb()
        const tx = db.transaction([STORES.DATABASES, STORES.ROWS], 'readwrite')

        // Delete all rows in this database
        const rows = await tx.objectStore(STORES.ROWS).index('by-database').getAll(pageId)
        for (const row of rows) {
            await tx.objectStore(STORES.ROWS).delete((row as Row).id)
        }

        // Delete database definition
        await tx.objectStore(STORES.DATABASES).delete(pageId)
        await tx.done
    }

    // ============================================
    // Row Operations
    // ============================================

    async listRows(databasePageId: string): Promise<RowSummary[]> {
        const db = this.ensureDb()
        const rows = await db.getAllFromIndex(STORES.ROWS, 'by-database', databasePageId)

        // Get associated page titles for row summaries
        const summaries: RowSummary[] = []
        for (const row of rows as Row[]) {
            const page = await this.getPage(row.pageId)
            summaries.push({
                id: row.id,
                databasePageId: row.databasePageId,
                pageId: row.pageId,
                title: page?.title ?? 'Untitled',
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            })
        }
        return summaries
    }

    async getRow(rowId: string): Promise<Row | null> {
        const db = this.ensureDb()
        const row = await db.get(STORES.ROWS, rowId)
        return row as Row | null
    }

    async upsertRow(row: Row): Promise<void> {
        const db = this.ensureDb()
        await db.put(STORES.ROWS, row)
    }

    async deleteRow(rowId: string): Promise<void> {
        const db = this.ensureDb()
        await db.delete(STORES.ROWS, rowId)
    }

    // ============================================
    // Settings Operations
    // ============================================

    async getSettings(id: string): Promise<Settings | null> {
        const db = this.ensureDb()
        const settings = await db.get(STORES.SETTINGS, id)
        return settings as Settings | null
    }

    async upsertSettings(settings: Settings): Promise<void> {
        const db = this.ensureDb()
        await db.put(STORES.SETTINGS, settings)
    }

    // ============================================
    // Export / Import Operations
    // ============================================

    async exportWorkspace(workspaceId: string): Promise<WorkspaceExport> {
        const db = this.ensureDb()

        const workspace = await this.getWorkspace(workspaceId)
        if (!workspace) {
            throw new Error(`Workspace not found: ${workspaceId}`)
        }

        const pages = await db.getAllFromIndex(STORES.PAGES, 'by-workspace', workspaceId) as Page[]
        const databases: Database[] = []
        const rows: Row[] = []

        for (const page of pages) {
            if (page.type === 'database') {
                const database = await this.getDatabase(page.id)
                if (database) {
                    databases.push(database)
                    const dbRows = await db.getAllFromIndex(STORES.ROWS, 'by-database', page.id) as Row[]
                    rows.push(...dbRows)
                }
            }
        }

        const settings = await this.getSettings('default')

        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            workspace,
            pages,
            databases,
            rows,
            settings
        }
    }

    async exportPage(pageId: string, includeChildren: boolean): Promise<WorkspaceExport> {
        const page = await this.getPage(pageId)
        if (!page) {
            throw new Error(`Page not found: ${pageId}`)
        }

        const workspace = await this.getWorkspace(page.workspaceId)
        if (!workspace) {
            throw new Error(`Workspace not found: ${page.workspaceId}`)
        }

        const pages: Page[] = [page]
        const databases: Database[] = []
        const rows: Row[] = []

        if (includeChildren) {
            await this.collectChildPages(page.id, pages)
        }

        for (const p of pages) {
            if (p.type === 'database') {
                const database = await this.getDatabase(p.id)
                if (database) {
                    databases.push(database)
                    const db = this.ensureDb()
                    const dbRows = await db.getAllFromIndex(STORES.ROWS, 'by-database', p.id) as Row[]
                    rows.push(...dbRows)
                }
            }
        }

        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            workspace,
            pages,
            databases,
            rows,
            settings: null
        }
    }

    private async collectChildPages(parentId: string, collected: Page[]): Promise<void> {
        const children = await this.getChildPages(parentId)
        for (const child of children) {
            const fullPage = await this.getPage(child.id)
            if (fullPage) {
                collected.push(fullPage)
                await this.collectChildPages(fullPage.id, collected)
            }
        }
    }

    async exportDatabase(databasePageId: string): Promise<WorkspaceExport> {
        const page = await this.getPage(databasePageId)
        if (!page || page.type !== 'database') {
            throw new Error(`Database page not found: ${databasePageId}`)
        }

        const workspace = await this.getWorkspace(page.workspaceId)
        if (!workspace) {
            throw new Error(`Workspace not found: ${page.workspaceId}`)
        }

        const database = await this.getDatabase(databasePageId)
        if (!database) {
            throw new Error(`Database definition not found: ${databasePageId}`)
        }

        const db = this.ensureDb()
        const rows = await db.getAllFromIndex(STORES.ROWS, 'by-database', databasePageId) as Row[]

        // Also include the page for each row
        const pages: Page[] = [page]
        for (const row of rows) {
            const rowPage = await this.getPage(row.pageId)
            if (rowPage) {
                pages.push(rowPage)
            }
        }

        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            workspace,
            pages,
            databases: [database],
            rows,
            settings: null
        }
    }

    async importWorkspace(
        workspaceId: string | null,
        data: WorkspaceExport,
        mode: 'replace' | 'merge'
    ): Promise<ImportResult> {
        const result: ImportResult = {
            success: true,
            pagesAdded: 0,
            pagesUpdated: 0,
            rowsAdded: 0,
            rowsUpdated: 0,
            conflicts: [],
            errors: []
        }

        try {
            // Validate import data version
            if (data.version > 1) {
                throw new Error(`Unsupported export version: ${data.version}. Please update the app.`)
            }

            const targetWorkspaceId = workspaceId ?? data.workspace.id

            if (mode === 'replace') {
                // Clear existing workspace data
                const existingWorkspace = await this.getWorkspace(targetWorkspaceId)
                if (existingWorkspace) {
                    await this.deleteWorkspace(targetWorkspaceId)
                }

                // Import workspace
                await this.upsertWorkspace({
                    ...data.workspace,
                    id: targetWorkspaceId,
                    updatedAt: new Date().toISOString()
                })

                // Import all pages
                for (const page of data.pages) {
                    await this.upsertPage({
                        ...page,
                        workspaceId: targetWorkspaceId
                    })
                    result.pagesAdded++
                }

                // Import all databases
                for (const database of data.databases) {
                    await this.upsertDatabase(database)
                }

                // Import all rows
                for (const row of data.rows) {
                    await this.upsertRow(row)
                    result.rowsAdded++
                }

                // Import settings if present
                if (data.settings) {
                    await this.upsertSettings(data.settings)
                }
            } else {
                // Merge mode
                let workspace = await this.getWorkspace(targetWorkspaceId)
                if (!workspace) {
                    workspace = {
                        ...data.workspace,
                        id: targetWorkspaceId,
                        updatedAt: new Date().toISOString()
                    }
                    await this.upsertWorkspace(workspace)
                }

                // Merge pages
                for (const importedPage of data.pages) {
                    const existingPage = await this.getPage(importedPage.id)
                    if (!existingPage) {
                        // New page - add it
                        await this.upsertPage({
                            ...importedPage,
                            workspaceId: targetWorkspaceId
                        })
                        result.pagesAdded++
                    } else {
                        // Conflict - compare timestamps
                        const conflict: ImportConflict = {
                            type: 'page',
                            id: importedPage.id,
                            localUpdatedAt: existingPage.updatedAt,
                            importedUpdatedAt: importedPage.updatedAt,
                            localTitle: existingPage.title,
                            importedTitle: importedPage.title
                        }
                        result.conflicts.push(conflict)

                        // Default: keep the more recent one
                        if (new Date(importedPage.updatedAt) > new Date(existingPage.updatedAt)) {
                            await this.upsertPage({
                                ...importedPage,
                                workspaceId: targetWorkspaceId
                            })
                            result.pagesUpdated++
                        }
                    }
                }

                // Merge databases
                for (const database of data.databases) {
                    await this.upsertDatabase(database)
                }

                // Merge rows
                for (const importedRow of data.rows) {
                    const existingRow = await this.getRow(importedRow.id)
                    if (!existingRow) {
                        await this.upsertRow(importedRow)
                        result.rowsAdded++
                    } else {
                        // Keep more recent
                        if (new Date(importedRow.updatedAt) > new Date(existingRow.updatedAt)) {
                            await this.upsertRow(importedRow)
                            result.rowsUpdated++
                        }
                    }
                }
            }
        } catch (error) {
            result.success = false
            result.errors.push(error instanceof Error ? error.message : String(error))
        }

        return result
    }

    // ============================================
    // Utility Operations
    // ============================================

    async getStats(): Promise<{
        workspaceCount: number
        pageCount: number
        databaseCount: number
        rowCount: number
        estimatedSizeBytes: number
    }> {
        const db = this.ensureDb()

        const workspaces = await db.getAll(STORES.WORKSPACES)
        const pages = await db.getAll(STORES.PAGES)
        const databases = await db.getAll(STORES.DATABASES)
        const rows = await db.getAll(STORES.ROWS)

        // Rough size estimation
        const estimatedSizeBytes =
            JSON.stringify(workspaces).length +
            JSON.stringify(pages).length +
            JSON.stringify(databases).length +
            JSON.stringify(rows).length

        return {
            workspaceCount: workspaces.length,
            pageCount: pages.length,
            databaseCount: databases.length,
            rowCount: rows.length,
            estimatedSizeBytes
        }
    }

    async clearAll(): Promise<void> {
        const db = this.ensureDb()
        const tx = db.transaction(
            [STORES.WORKSPACES, STORES.PAGES, STORES.DATABASES, STORES.ROWS, STORES.SETTINGS],
            'readwrite'
        )

        await tx.objectStore(STORES.WORKSPACES).clear()
        await tx.objectStore(STORES.PAGES).clear()
        await tx.objectStore(STORES.DATABASES).clear()
        await tx.objectStore(STORES.ROWS).clear()
        await tx.objectStore(STORES.SETTINGS).clear()

        await tx.done
    }
}
