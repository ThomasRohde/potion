/**
 * Tests for IndexedDbStorageAdapter
 * 
 * Uses Bun's test runner with happy-dom for IndexedDB mock support.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter'
import type { Workspace, Page, Database, Row, Settings } from '../types'

// Note: These tests require a browser-like environment with IndexedDB
// In Bun, we need to use happy-dom or jsdom for this.
// For now, we test the interface contracts and basic logic.

describe('IndexedDbStorageAdapter', () => {
    let storage: IndexedDbStorageAdapter

    beforeEach(async () => {
        storage = new IndexedDbStorageAdapter()
        // Note: init() requires IndexedDB, which may not be available in Node/Bun test env
        // These tests are designed to run in a browser or with proper polyfill
    })

    afterEach(async () => {
        if (storage) {
            await storage.close()
        }
    })

    test('should be instantiable', () => {
        expect(storage).toBeInstanceOf(IndexedDbStorageAdapter)
    })

    test('should throw error when accessing before init', async () => {
        // Access internal ensureDb via a method that uses it
        await expect(storage.listWorkspaces()).rejects.toThrow('Database not initialized')
    })
})

describe('Type contracts', () => {
    test('Workspace type should have required fields', () => {
        const workspace: Workspace = {
            id: 'test-id',
            name: 'Test Workspace',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        }
        expect(workspace.id).toBe('test-id')
        expect(workspace.version).toBe(1)
    })

    test('Page type should have required fields', () => {
        const page: Page = {
            id: 'page-1',
            workspaceId: 'workspace-1',
            parentPageId: null,
            title: 'Test Page',
            type: 'page',
            isFavorite: false,
            content: { version: 1, blocks: [] },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        expect(page.type).toBe('page')
        expect(page.content.blocks).toEqual([])
    })

    test('Database type should have required fields', () => {
        const database: Database = {
            pageId: 'db-page-1',
            properties: [
                { id: 'prop-1', name: 'Name', type: 'text' },
                { id: 'prop-2', name: 'Status', type: 'select', options: [
                    { id: 'opt-1', name: 'Done', color: 'green' }
                ]}
            ],
            views: [{
                id: 'view-1',
                name: 'Default',
                type: 'table',
                filters: [],
                sorts: []
            }]
        }
        expect(database.properties).toHaveLength(2)
        expect(database.views[0].type).toBe('table')
    })

    test('Row type should have required fields', () => {
        const row: Row = {
            id: 'row-1',
            databasePageId: 'db-page-1',
            pageId: 'row-page-1',
            values: {
                'prop-1': 'Task 1',
                'prop-2': 'opt-1'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        expect(row.values['prop-1']).toBe('Task 1')
    })

    test('Settings type should have required fields', () => {
        const settings: Settings = {
            id: 'default',
            theme: 'system',
            fontSize: 16,
            editorWidth: 'medium',
            sidebarCollapsed: false
        }
        expect(settings.theme).toBe('system')
    })
})
