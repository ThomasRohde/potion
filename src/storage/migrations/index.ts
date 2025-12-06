/**
 * Database Migrations System
 * 
 * Handles versioned schema migrations for IndexedDB storage.
 * Runs automatically on app load, creates backups before destructive changes.
 */

import type { StorageAdapter } from '../StorageAdapter'

export interface Migration {
    version: number
    name: string
    description: string
    destructive: boolean // If true, backup will be created before running
    up: (storage: StorageAdapter) => Promise<void>
    down?: (storage: StorageAdapter) => Promise<void> // Optional rollback
}

export interface MigrationRecord {
    version: number
    name: string
    appliedAt: string
    success: boolean
    error?: string
    backupKey?: string // Key to restore from if rollback needed
}

export interface MigrationState {
    currentVersion: number
    history: MigrationRecord[]
    lastMigrationAt: string | null
}

// Registry of all migrations in order
const migrations: Migration[] = []

/**
 * Register a migration with the system
 */
export function registerMigration(migration: Migration): void {
    // Ensure migrations are in order
    const existing = migrations.find(m => m.version === migration.version)
    if (existing) {
        throw new Error(`Migration version ${migration.version} already registered`)
    }
    migrations.push(migration)
    migrations.sort((a, b) => a.version - b.version)
}

/**
 * Get all registered migrations
 */
export function getMigrations(): readonly Migration[] {
    return migrations
}

/**
 * Get pending migrations (versions higher than current)
 */
export function getPendingMigrations(currentVersion: number): Migration[] {
    return migrations.filter(m => m.version > currentVersion)
}

/**
 * Create a backup key for the current state
 */
function generateBackupKey(version: number): string {
    return `potion-backup-v${version}-${Date.now()}`
}

/**
 * Export current state to localStorage as backup
 * (For IndexedDB we can't easily clone, so we export to JSON)
 */
async function createBackup(
    storage: StorageAdapter,
    version: number
): Promise<string> {
    const backupKey = generateBackupKey(version)

    // Export all workspace data
    const workspaces = await storage.listWorkspaces()
    const backupData: Record<string, unknown> = {
        version,
        createdAt: new Date().toISOString(),
        workspaces: []
    }

    for (const workspace of workspaces) {
        const exportData = await storage.exportWorkspace(workspace.id)
            ; (backupData.workspaces as unknown[]).push(exportData)
    }

    // Store in localStorage (limited but good for small backups)
    try {
        localStorage.setItem(backupKey, JSON.stringify(backupData))
    } catch (e) {
        // If localStorage is full, just log warning
        console.warn('Could not create backup in localStorage:', e)
    }

    return backupKey
}

/**
 * Get list of available backups
 */
export function listBackups(): { key: string; version: number; createdAt: string }[] {
    const backups: { key: string; version: number; createdAt: string }[] = []

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('potion-backup-v')) {
            try {
                const data = JSON.parse(localStorage.getItem(key) || '{}')
                backups.push({
                    key,
                    version: data.version || 0,
                    createdAt: data.createdAt || 'unknown'
                })
            } catch {
                // Skip invalid backups
            }
        }
    }

    return backups.sort((a, b) => b.version - a.version)
}

/**
 * Delete old backups, keeping only the most recent N
 */
export function pruneBackups(keepCount: number = 3): void {
    const backups = listBackups()
    const toDelete = backups.slice(keepCount)

    for (const backup of toDelete) {
        localStorage.removeItem(backup.key)
    }
}

// Storage key for migration state
const MIGRATION_STATE_KEY = 'potion-migration-state'

/**
 * Get the current migration state
 */
export function getMigrationState(): MigrationState {
    const stored = localStorage.getItem(MIGRATION_STATE_KEY)
    if (!stored) {
        return {
            currentVersion: 0,
            history: [],
            lastMigrationAt: null
        }
    }

    try {
        return JSON.parse(stored)
    } catch {
        return {
            currentVersion: 0,
            history: [],
            lastMigrationAt: null
        }
    }
}

/**
 * Save migration state
 */
function saveMigrationState(state: MigrationState): void {
    localStorage.setItem(MIGRATION_STATE_KEY, JSON.stringify(state))
}

/**
 * Run all pending migrations
 * Returns the result of the migration process
 */
export async function runMigrations(storage: StorageAdapter): Promise<{
    success: boolean
    migrationsRun: number
    finalVersion: number
    errors: string[]
}> {
    const state = getMigrationState()
    const pending = getPendingMigrations(state.currentVersion)

    const result = {
        success: true,
        migrationsRun: 0,
        finalVersion: state.currentVersion,
        errors: [] as string[]
    }

    if (pending.length === 0) {
        return result
    }

    console.log(`[Migrations] Running ${pending.length} pending migrations...`)

    for (const migration of pending) {
        const record: MigrationRecord = {
            version: migration.version,
            name: migration.name,
            appliedAt: new Date().toISOString(),
            success: false
        }

        try {
            // Create backup before destructive migrations
            if (migration.destructive) {
                console.log(`[Migrations] Creating backup before v${migration.version}...`)
                record.backupKey = await createBackup(storage, state.currentVersion)
            }

            console.log(`[Migrations] Running migration v${migration.version}: ${migration.name}`)
            await migration.up(storage)

            record.success = true
            state.currentVersion = migration.version
            state.history.push(record)
            state.lastMigrationAt = new Date().toISOString()
            saveMigrationState(state)

            result.migrationsRun++
            result.finalVersion = migration.version

            console.log(`[Migrations] Completed v${migration.version}`)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            record.error = errorMsg
            state.history.push(record)
            saveMigrationState(state)

            result.success = false
            result.errors.push(`Migration v${migration.version} failed: ${errorMsg}`)

            console.error(`[Migrations] Failed v${migration.version}:`, error)

            // Stop on first error
            break
        }
    }

    // Prune old backups after successful migrations
    if (result.success) {
        pruneBackups(3)
    }

    return result
}

/**
 * Get the target schema version (latest migration version)
 */
export function getTargetVersion(): number {
    if (migrations.length === 0) {
        return 0
    }
    return migrations[migrations.length - 1].version
}

/**
 * Check if migrations are needed
 */
export function needsMigrations(): boolean {
    const state = getMigrationState()
    return state.currentVersion < getTargetVersion()
}
