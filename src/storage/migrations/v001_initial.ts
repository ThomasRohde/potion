/**
 * Migration Version 1: Initial Schema
 * 
 * This is the baseline migration that represents the initial schema.
 * It doesn't actually change anything - it just establishes the version baseline.
 */

import { registerMigration } from './index'

registerMigration({
    version: 1,
    name: 'initial-schema',
    description: 'Establishes baseline schema with workspaces, pages, databases, rows, and settings stores',
    destructive: false,
    
    async up() {
        // No-op - this migration just establishes the baseline
        // The IndexedDB stores are already created in the adapter's upgrade handler
        console.log('[Migration v1] Baseline schema established')
    },
    
    async down() {
        // Cannot downgrade from v1 - it's the baseline
        throw new Error('Cannot downgrade from baseline version 1')
    }
})
