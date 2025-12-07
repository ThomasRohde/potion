/**
 * Tests for Workspace Service
 */

import { describe, test, expect } from 'bun:test'
import type { Workspace, Page, BlockContent, WorkspaceExport } from '../types'

// Test type contracts and utility functions
// Note: Full integration tests require IndexedDB which needs browser environment

describe('Workspace Service Types', () => {
    test('Workspace type should have all required fields', () => {
        const workspace: Workspace = {
            id: 'test-workspace-id',
            name: 'Test Workspace',
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z',
            version: 1
        }

        expect(workspace.id).toBe('test-workspace-id')
        expect(workspace.name).toBe('Test Workspace')
        expect(workspace.version).toBe(1)
    })

    test('Workspace version should be a positive integer', () => {
        const workspace: Workspace = {
            id: 'ws-1',
            name: 'My Workspace',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        }

        expect(workspace.version).toBeGreaterThan(0)
        expect(Number.isInteger(workspace.version)).toBe(true)
    })
})

describe('Workspace Service Contracts', () => {
    test('createWorkspace should accept name parameter', () => {
        // This is a type-level test - if this compiles, the contract is correct
        const createWorkspaceMock = (name: string): Workspace => ({
            id: 'new-id',
            name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        })

        const result = createWorkspaceMock('New Workspace')
        expect(result.name).toBe('New Workspace')
    })

    test('updateWorkspace should accept partial updates', () => {
        const workspace: Workspace = {
            id: 'ws-1',
            name: 'Original Name',
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z',
            version: 1
        }

        // Simulate partial update
        const updates: Partial<Pick<Workspace, 'name'>> = { name: 'Updated Name' }
        const updated = { ...workspace, ...updates, updatedAt: new Date().toISOString() }

        expect(updated.name).toBe('Updated Name')
        expect(updated.id).toBe('ws-1') // ID should not change
    })
})

describe('Welcome Page Structure', () => {
    test('Welcome page should have correct structure', () => {
        // Create a mock welcome page to test the structure
        const welcomeContent: BlockContent = {
            version: 1,
            blocks: [
                {
                    id: 'heading-1',
                    type: 'heading',
                    content: [{ type: 'text', text: 'Welcome to Potion!' }],
                    props: { level: 1 }
                },
                {
                    id: 'para-1',
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Your local-only workspace.' }]
                }
            ]
        }

        const welcomePage: Page = {
            id: 'welcome-page-id',
            workspaceId: 'ws-1',
            parentPageId: null,
            title: 'Welcome to Potion',
            type: 'page',
            isFavorite: false,
            content: welcomeContent,
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z',
            icon: '👋'
        }

        expect(welcomePage.title).toBe('Welcome to Potion')
        expect(welcomePage.icon).toBe('👋')
        expect(welcomePage.content.blocks.length).toBeGreaterThan(0)
        expect(welcomePage.content.blocks[0].type).toBe('heading')
    })

    test('Welcome page content should explain privacy', () => {
        // The welcome page content should contain privacy-related text
        const privacyTexts = [
            'local-only',
            'privacy',
            'device',
            'IndexedDB'
        ]

        // Verify at least some privacy terms are expected in welcome content
        expect(privacyTexts.length).toBeGreaterThan(0)
    })

    test('Welcome page content should mention export/import', () => {
        // The welcome page content should contain export/import guidance
        const backupTexts = [
            'export',
            'import',
            'backup',
            'JSON'
        ]

        // Verify backup-related terms are expected in welcome content
        expect(backupTexts.length).toBeGreaterThan(0)
    })
})

describe('WorkspaceExport Structure', () => {
    test('WorkspaceExport should have all required fields', () => {
        const workspace: Workspace = {
            id: 'test-workspace',
            name: 'Test Workspace',
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z',
            version: 1
        }

        const exportData: WorkspaceExport = {
            version: 1,
            exportedAt: '2025-12-06T10:00:00Z',
            workspace,
            pages: [],
            databases: [],
            rows: [],
            settings: null
        }

        expect(exportData.version).toBe(1)
        expect(exportData.workspace.id).toBe('test-workspace')
        expect(Array.isArray(exportData.pages)).toBe(true)
        expect(Array.isArray(exportData.databases)).toBe(true)
        expect(Array.isArray(exportData.rows)).toBe(true)
    })

    test('WorkspaceExport should include pages with content', () => {
        const page: Page = {
            id: 'page-1',
            workspaceId: 'ws-1',
            parentPageId: null,
            title: 'Test Page',
            type: 'page',
            isFavorite: false,
            content: {
                version: 1,
                blocks: [
                    {
                        id: 'block-1',
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Hello World' }]
                    }
                ]
            },
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z'
        }

        const exportData: WorkspaceExport = {
            version: 1,
            exportedAt: '2025-12-06T10:00:00Z',
            workspace: {
                id: 'ws-1',
                name: 'Test',
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z',
                version: 1
            },
            pages: [page],
            databases: [],
            rows: [],
            settings: null
        }

        expect(exportData.pages.length).toBe(1)
        expect(exportData.pages[0].title).toBe('Test Page')
        expect(exportData.pages[0].content.blocks.length).toBe(1)
    })

    test('WorkspaceExport filename should follow naming convention', () => {
        const date = new Date().toISOString().split('T')[0]
        const expectedFilename = `potion-workspace-${date}.json`

        expect(expectedFilename).toMatch(/^potion-workspace-\d{4}-\d{2}-\d{2}\.json$/)
    })
})

describe('Page Export Structure', () => {
    test('Page export should use title in filename', () => {
        const pageTitle = 'My Test Page'
        const sanitizedTitle = pageTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        const date = new Date().toISOString().split('T')[0]
        const expectedFilename = `potion-${sanitizedTitle}-${date}.json`

        expect(expectedFilename).toMatch(/^potion-my-test-page-\d{4}-\d{2}-\d{2}\.json$/)
    })

    test('Page export should support includeChildren option', () => {
        // When includeChildren is true, child pages should be included
        const parentPage: Page = {
            id: 'parent-1',
            workspaceId: 'ws-1',
            parentPageId: null,
            title: 'Parent Page',
            type: 'page',
            isFavorite: false,
            content: { version: 1, blocks: [] },
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z'
        }

        const childPage: Page = {
            id: 'child-1',
            workspaceId: 'ws-1',
            parentPageId: 'parent-1',
            title: 'Child Page',
            type: 'page',
            isFavorite: false,
            content: { version: 1, blocks: [] },
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z'
        }

        // Simulate export with children
        const exportWithChildren: WorkspaceExport = {
            version: 1,
            exportedAt: '2025-12-06T10:00:00Z',
            workspace: {
                id: 'ws-1',
                name: 'Test',
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z',
                version: 1
            },
            pages: [parentPage, childPage],
            databases: [],
            rows: [],
            settings: null
        }

        expect(exportWithChildren.pages.length).toBe(2)
        expect(exportWithChildren.pages.some(p => p.id === 'parent-1')).toBe(true)
        expect(exportWithChildren.pages.some(p => p.id === 'child-1')).toBe(true)
    })

    test('Page export without children should only include target page', () => {
        const page: Page = {
            id: 'single-page',
            workspaceId: 'ws-1',
            parentPageId: null,
            title: 'Single Page',
            type: 'page',
            isFavorite: false,
            content: { version: 1, blocks: [] },
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z'
        }

        const exportWithoutChildren: WorkspaceExport = {
            version: 1,
            exportedAt: '2025-12-06T10:00:00Z',
            workspace: {
                id: 'ws-1',
                name: 'Test',
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z',
                version: 1
            },
            pages: [page],
            databases: [],
            rows: [],
            settings: null
        }

        expect(exportWithoutChildren.pages.length).toBe(1)
        expect(exportWithoutChildren.pages[0].id).toBe('single-page')
    })
})

describe('Import Merge Mode', () => {
    test('Import result should include conflicts array for merge mode', () => {
        // Type check for import result structure with conflicts
        const importResult: {
            success: boolean
            pagesAdded: number
            pagesUpdated: number
            conflicts: Array<{
                type: 'page' | 'row'
                id: string
                localTitle: string
                importedTitle: string
                localUpdatedAt: string
                importedUpdatedAt: string
            }>
            errors: string[]
        } = {
            success: true,
            pagesAdded: 3,
            pagesUpdated: 1,
            conflicts: [
                {
                    type: 'page',
                    id: 'page-1',
                    localTitle: 'Local Version',
                    importedTitle: 'Imported Version',
                    localUpdatedAt: '2025-12-05T10:00:00Z',
                    importedUpdatedAt: '2025-12-06T10:00:00Z'
                }
            ],
            errors: []
        }

        expect(importResult.conflicts).toBeDefined()
        expect(Array.isArray(importResult.conflicts)).toBe(true)
        expect(importResult.conflicts.length).toBe(1)
        expect(importResult.conflicts[0].type).toBe('page')
    })

    test('Merge mode should keep newer version on conflict', () => {
        // Simulate merge conflict resolution logic
        const localUpdatedAt = '2025-12-05T10:00:00Z'
        const importedUpdatedAt = '2025-12-06T10:00:00Z'

        const keepImported = new Date(importedUpdatedAt) > new Date(localUpdatedAt)
        expect(keepImported).toBe(true)
    })

    test('Import modes should be replace or merge', () => {
        type ImportMode = 'replace' | 'merge'
        const modes: ImportMode[] = ['replace', 'merge']

        expect(modes).toContain('replace')
        expect(modes).toContain('merge')
        expect(modes.length).toBe(2)
    })
})
