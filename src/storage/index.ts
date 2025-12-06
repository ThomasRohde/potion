/**
 * Storage Module Exports
 * 
 * Re-exports the storage adapter interface and implementations.
 * UI code should import from this module, not directly from implementations.
 */

export type { StorageAdapter } from './StorageAdapter'
export { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter'

// Migration system exports
export {
    runMigrations,
    getMigrationState,
    getMigrations,
    getPendingMigrations,
    getTargetVersion,
    needsMigrations,
    listBackups,
    pruneBackups,
    type Migration,
    type MigrationRecord,
    type MigrationState
} from './migrations'

// Import migrations to register them
import './migrations/v001_initial'
import './migrations/v002_lastAccessedAt'

// Default storage instance (singleton)
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter'
import { runMigrations, getMigrationState, getTargetVersion } from './migrations'

let defaultStorage: IndexedDbStorageAdapter | null = null
let migrationsRun = false
let initPromise: Promise<IndexedDbStorageAdapter> | null = null

/**
 * Get the default storage adapter instance.
 * Initializes lazily on first call and runs migrations.
 * Uses a single promise to prevent race conditions.
 */
export async function getStorage(): Promise<IndexedDbStorageAdapter> {
    // If already initialized, return immediately
    if (defaultStorage && migrationsRun) {
        return defaultStorage
    }

    // If initialization is in progress, wait for it
    if (initPromise) {
        return initPromise
    }

    // Start initialization
    initPromise = (async () => {
        if (!defaultStorage) {
            defaultStorage = new IndexedDbStorageAdapter()
            await defaultStorage.init()
        }

        // Run migrations on first initialization
        if (!migrationsRun) {
            const state = getMigrationState()
            const targetVersion = getTargetVersion()

            if (state.currentVersion < targetVersion) {
                console.log(`[Storage] Migrating from v${state.currentVersion} to v${targetVersion}...`)
                const result = await runMigrations(defaultStorage)

                if (!result.success) {
                    console.error('[Storage] Migration failed:', result.errors)
                    // Still continue - app may work with partial migrations
                } else if (result.migrationsRun > 0) {
                    console.log(`[Storage] Successfully ran ${result.migrationsRun} migrations`)
                }
            }

            migrationsRun = true
        }

        return defaultStorage
    })()

    return initPromise
}

/**
 * Reset the default storage instance.
 * Useful for testing or when switching workspaces.
 */
export async function resetStorage(): Promise<void> {
    if (defaultStorage) {
        await defaultStorage.close()
        defaultStorage = null
        migrationsRun = false
        initPromise = null
    }
}
