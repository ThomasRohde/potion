/**
 * Storage Module Exports
 * 
 * Re-exports the storage adapter interface and implementations.
 * UI code should import from this module, not directly from implementations.
 */

export type { StorageAdapter } from './StorageAdapter'
export { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter'

// Default storage instance (singleton)
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter'

let defaultStorage: IndexedDbStorageAdapter | null = null

/**
 * Get the default storage adapter instance.
 * Initializes lazily on first call.
 */
export async function getStorage(): Promise<IndexedDbStorageAdapter> {
    if (!defaultStorage) {
        defaultStorage = new IndexedDbStorageAdapter()
        await defaultStorage.init()
    }
    return defaultStorage
}

/**
 * Reset the default storage instance.
 * Useful for testing or when switching workspaces.
 */
export async function resetStorage(): Promise<void> {
    if (defaultStorage) {
        await defaultStorage.close()
        defaultStorage = null
    }
}
