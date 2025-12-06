/**
 * Workspace Service
 * 
 * High-level API for workspace operations.
 * Wraps StorageAdapter methods with business logic.
 */

import { v4 as uuidv4 } from 'uuid'
import { getStorage } from '../storage'
import type { Workspace, Page, BlockContent } from '../types'

const DEFAULT_WORKSPACE_ID = 'default-workspace'
const CURRENT_SCHEMA_VERSION = 1

/**
 * Create a new workspace.
 */
export async function createWorkspace(name: string): Promise<Workspace> {
    const storage = await getStorage()
    const now = new Date().toISOString()

    const workspace: Workspace = {
        id: uuidv4(),
        name,
        createdAt: now,
        updatedAt: now,
        version: CURRENT_SCHEMA_VERSION
    }

    await storage.upsertWorkspace(workspace)
    return workspace
}

/**
 * Get a workspace by ID.
 */
export async function getWorkspace(id: string): Promise<Workspace | null> {
    const storage = await getStorage()
    return storage.getWorkspace(id)
}

/**
 * Get the default/current workspace.
 * Creates one if it doesn't exist, along with a Welcome page.
 */
export async function getOrCreateDefaultWorkspace(): Promise<Workspace> {
    const storage = await getStorage()
    let workspace = await storage.getWorkspace(DEFAULT_WORKSPACE_ID)

    if (!workspace) {
        const now = new Date().toISOString()
        workspace = {
            id: DEFAULT_WORKSPACE_ID,
            name: 'My Workspace',
            createdAt: now,
            updatedAt: now,
            version: CURRENT_SCHEMA_VERSION
        }
        await storage.upsertWorkspace(workspace)

        // Create Welcome page for new workspace
        const welcomePage = createWelcomePage(DEFAULT_WORKSPACE_ID, now)
        await storage.upsertPage(welcomePage)
    }

    return workspace
}

/**
 * Create a Welcome page with onboarding content.
 */
function createWelcomePage(workspaceId: string, timestamp: string): Page {
    const welcomeContent: BlockContent = {
        version: 1,
        blocks: [
            {
                id: uuidv4(),
                type: 'heading',
                content: [{ type: 'text', text: 'Welcome to Potion! 🧪' }],
                props: { level: 1 }
            },
            {
                id: uuidv4(),
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'Potion is your local-only, privacy-first workspace for notes and databases. All your data stays on your device — nothing is ever sent to a server.'
                }]
            },
            {
                id: uuidv4(),
                type: 'heading',
                content: [{ type: 'text', text: '🔒 Privacy First' }],
                props: { level: 2 }
            },
            {
                id: uuidv4(),
                type: 'bulletListItem',
                content: [{ type: 'text', text: 'Your data is stored locally in your browser using IndexedDB' }]
            },
            {
                id: uuidv4(),
                type: 'bulletListItem',
                content: [{ type: 'text', text: 'No accounts, no cloud sync, no tracking' }]
            },
            {
                id: uuidv4(),
                type: 'bulletListItem',
                content: [{ type: 'text', text: 'Works offline after the first load' }]
            },
            {
                id: uuidv4(),
                type: 'heading',
                content: [{ type: 'text', text: '💾 Backup Your Work' }],
                props: { level: 2 }
            },
            {
                id: uuidv4(),
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'Since data is stored locally, you should regularly export your workspace to keep a backup. Use the export feature to download a JSON file you can import later or on another device.'
                }]
            },
            {
                id: uuidv4(),
                type: 'heading',
                content: [{ type: 'text', text: '✨ Getting Started' }],
                props: { level: 2 }
            },
            {
                id: uuidv4(),
                type: 'numberedListItem',
                content: [{
                    type: 'text',
                    text: 'Create a new page by clicking "+ New page" in the sidebar'
                }]
            },
            {
                id: uuidv4(),
                type: 'numberedListItem',
                content: [{
                    type: 'text',
                    text: 'Use the / command to insert different block types'
                }]
            },
            {
                id: uuidv4(),
                type: 'numberedListItem',
                content: [{
                    type: 'text',
                    text: 'Press Ctrl+K (or Cmd+K on Mac) to quickly search your pages'
                }]
            },
            {
                id: uuidv4(),
                type: 'numberedListItem',
                content: [{
                    type: 'text',
                    text: 'Star pages to add them to your favorites'
                }]
            },
            {
                id: uuidv4(),
                type: 'divider',
                content: []
            },
            {
                id: uuidv4(),
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'Feel free to delete this page once you\'re familiar with the app. Happy note-taking!'
                }]
            }
        ]
    }

    return {
        id: uuidv4(),
        workspaceId,
        parentPageId: null,
        title: 'Welcome to Potion',
        type: 'page',
        isFavorite: false,
        content: welcomeContent,
        createdAt: timestamp,
        updatedAt: timestamp,
        icon: '👋'
    }
}

/**
 * List all workspaces.
 */
export async function listWorkspaces(): Promise<Workspace[]> {
    const storage = await getStorage()
    return storage.listWorkspaces()
}

/**
 * Update workspace name.
 */
export async function updateWorkspaceName(id: string, name: string): Promise<Workspace> {
    const storage = await getStorage()
    const workspace = await storage.getWorkspace(id)

    if (!workspace) {
        throw new Error(`Workspace not found: ${id}`)
    }

    const updated: Workspace = {
        ...workspace,
        name,
        updatedAt: new Date().toISOString()
    }

    await storage.upsertWorkspace(updated)
    return updated
}

/**
 * Update workspace (general update).
 */
export async function updateWorkspace(id: string, updates: Partial<Pick<Workspace, 'name'>>): Promise<Workspace> {
    const storage = await getStorage()
    const workspace = await storage.getWorkspace(id)

    if (!workspace) {
        throw new Error(`Workspace not found: ${id}`)
    }

    const updated: Workspace = {
        ...workspace,
        ...updates,
        updatedAt: new Date().toISOString()
    }

    await storage.upsertWorkspace(updated)
    return updated
}

/**
 * Delete a workspace and all its contents.
 */
export async function deleteWorkspace(id: string): Promise<void> {
    const storage = await getStorage()
    await storage.deleteWorkspace(id)
}

/**
 * Get workspace statistics.
 */
export async function getWorkspaceStats(): Promise<{
    workspaceCount: number
    pageCount: number
    databaseCount: number
    rowCount: number
    estimatedSizeBytes: number
}> {
    const storage = await getStorage()
    return storage.getStats()
}
