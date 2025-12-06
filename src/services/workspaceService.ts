/**
 * Workspace Service
 * 
 * High-level API for workspace operations.
 * Wraps StorageAdapter methods with business logic.
 */

import { v4 as uuidv4 } from 'uuid'
import { getStorage } from '../storage'
import type { Workspace } from '../types'

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
 * Creates one if it doesn't exist.
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
    }

    return workspace
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
