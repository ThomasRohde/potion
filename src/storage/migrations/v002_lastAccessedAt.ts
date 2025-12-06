/**
 * Migration Version 2: Add lastAccessedAt to pages
 * 
 * Example migration that adds a lastAccessedAt field to pages.
 * Demonstrates a non-destructive schema evolution.
 */

import { registerMigration } from './index'
import type { StorageAdapter } from '../StorageAdapter'
import type { Page } from '../../types'

registerMigration({
    version: 2,
    name: 'add-lastAccessedAt',
    description: 'Adds lastAccessedAt timestamp to all pages for recent pages feature',
    destructive: false, // Non-destructive - just adds a field
    
    async up(storage: StorageAdapter) {
        // Get all workspaces
        const workspaces = await storage.listWorkspaces()
        
        for (const workspace of workspaces) {
            // Get all pages in workspace
            const pageSummaries = await storage.listPages(workspace.id)
            
            for (const summary of pageSummaries) {
                const page = await storage.getPage(summary.id)
                if (page) {
                    // Add lastAccessedAt field if not present
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const pageAny = page as any
                    if (!pageAny.lastAccessedAt) {
                        pageAny.lastAccessedAt = page.updatedAt
                        await storage.upsertPage(pageAny as Page)
                    }
                }
            }
        }
        
        console.log('[Migration v2] Added lastAccessedAt to all pages')
    },
    
    async down(storage: StorageAdapter) {
        // Remove lastAccessedAt from all pages
        const workspaces = await storage.listWorkspaces()
        
        for (const workspace of workspaces) {
            const pageSummaries = await storage.listPages(workspace.id)
            
            for (const summary of pageSummaries) {
                const page = await storage.getPage(summary.id)
                if (page) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const pageAny = page as any
                    delete pageAny.lastAccessedAt
                    await storage.upsertPage(pageAny as Page)
                }
            }
        }
        
        console.log('[Migration v2] Removed lastAccessedAt from all pages')
    }
})
