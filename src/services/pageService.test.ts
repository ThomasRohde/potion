/**
 * Tests for Page Service
 */

import { describe, test, expect } from 'bun:test'
import { buildPageTree, createEmptyContent } from './pageService'
import type { PageSummary } from '../types'

describe('Page Service - createEmptyContent', () => {
    test('should create empty block content with correct version', () => {
        const content = createEmptyContent()

        expect(content.version).toBe(1)
        expect(content.blocks).toEqual([])
    })
})

describe('Page Service - buildPageTree', () => {
    test('should handle empty page list', () => {
        const tree = buildPageTree([])
        expect(tree).toEqual([])
    })

    test('should return root pages as top-level nodes', () => {
        const pages: PageSummary[] = [
            {
                id: 'page-1',
                workspaceId: 'ws-1',
                parentPageId: null,
                title: 'Root Page 1',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            },
            {
                id: 'page-2',
                workspaceId: 'ws-1',
                parentPageId: null,
                title: 'Root Page 2',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            }
        ]

        const tree = buildPageTree(pages)

        expect(tree).toHaveLength(2)
        expect(tree[0].children).toEqual([])
        expect(tree[1].children).toEqual([])
    })

    test('should nest child pages under parents', () => {
        const pages: PageSummary[] = [
            {
                id: 'parent',
                workspaceId: 'ws-1',
                parentPageId: null,
                title: 'Parent Page',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            },
            {
                id: 'child',
                workspaceId: 'ws-1',
                parentPageId: 'parent',
                title: 'Child Page',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            }
        ]

        const tree = buildPageTree(pages)

        expect(tree).toHaveLength(1)
        expect(tree[0].id).toBe('parent')
        expect(tree[0].children).toHaveLength(1)
        expect(tree[0].children[0].id).toBe('child')
    })

    test('should handle deeply nested pages', () => {
        const pages: PageSummary[] = [
            {
                id: 'level-1',
                workspaceId: 'ws-1',
                parentPageId: null,
                title: 'Level 1',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            },
            {
                id: 'level-2',
                workspaceId: 'ws-1',
                parentPageId: 'level-1',
                title: 'Level 2',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            },
            {
                id: 'level-3',
                workspaceId: 'ws-1',
                parentPageId: 'level-2',
                title: 'Level 3',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            }
        ]

        const tree = buildPageTree(pages)

        expect(tree).toHaveLength(1)
        expect(tree[0].children).toHaveLength(1)
        expect(tree[0].children[0].children).toHaveLength(1)
        expect(tree[0].children[0].children[0].id).toBe('level-3')
    })

    test('should sort pages alphabetically by title', () => {
        const pages: PageSummary[] = [
            {
                id: 'page-c',
                workspaceId: 'ws-1',
                parentPageId: null,
                title: 'Charlie',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            },
            {
                id: 'page-a',
                workspaceId: 'ws-1',
                parentPageId: null,
                title: 'Alpha',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            },
            {
                id: 'page-b',
                workspaceId: 'ws-1',
                parentPageId: null,
                title: 'Bravo',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            }
        ]

        const tree = buildPageTree(pages)

        expect(tree[0].title).toBe('Alpha')
        expect(tree[1].title).toBe('Bravo')
        expect(tree[2].title).toBe('Charlie')
    })

    test('should handle orphaned pages (parent not in list)', () => {
        const pages: PageSummary[] = [
            {
                id: 'orphan',
                workspaceId: 'ws-1',
                parentPageId: 'non-existent-parent',
                title: 'Orphaned Page',
                type: 'page',
                isFavorite: false,
                createdAt: '2025-12-06T00:00:00Z',
                updatedAt: '2025-12-06T00:00:00Z'
            }
        ]

        const tree = buildPageTree(pages)

        // Orphaned pages should appear at root level
        expect(tree).toHaveLength(1)
        expect(tree[0].id).toBe('orphan')
    })
})

describe('Page Service - Type Contracts', () => {
    test('PageSummary should have all required fields', () => {
        const summary: PageSummary = {
            id: 'page-1',
            workspaceId: 'ws-1',
            parentPageId: null,
            title: 'Test Page',
            type: 'page',
            isFavorite: false,
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z'
        }

        expect(summary.id).toBe('page-1')
        expect(summary.type).toBe('page')
    })

    test('PageSummary should support database type', () => {
        const summary: PageSummary = {
            id: 'db-1',
            workspaceId: 'ws-1',
            parentPageId: null,
            title: 'Task Database',
            type: 'database',
            isFavorite: true,
            createdAt: '2025-12-06T00:00:00Z',
            updatedAt: '2025-12-06T00:00:00Z'
        }

        expect(summary.type).toBe('database')
        expect(summary.isFavorite).toBe(true)
    })
})
