/**
 * Page Service
 * 
 * High-level API for page operations.
 * Wraps StorageAdapter methods with business logic.
 */

import { v4 as uuidv4 } from 'uuid'
import { getStorage } from '../storage'
import type { Page, PageSummary, BlockContent, PageType } from '../types'

/**
 * Create a new page with empty content.
 */
export async function createPage(
    workspaceId: string,
    title: string,
    options: {
        parentPageId?: string | null
        type?: PageType
        icon?: string
    } = {}
): Promise<Page> {
    const storage = await getStorage()
    const now = new Date().toISOString()

    const page: Page = {
        id: uuidv4(),
        workspaceId,
        parentPageId: options.parentPageId ?? null,
        title,
        type: options.type ?? 'page',
        isFavorite: false,
        content: createEmptyContent(),
        createdAt: now,
        updatedAt: now,
        icon: options.icon
    }

    await storage.upsertPage(page)
    return page
}

/**
 * Create empty block content for new pages.
 */
export function createEmptyContent(): BlockContent {
    return {
        version: 1,
        blocks: []
    }
}

/**
 * Get a page by ID.
 */
export async function getPage(pageId: string): Promise<Page | null> {
    const storage = await getStorage()
    return storage.getPage(pageId)
}

/**
 * List all pages in a workspace.
 */
export async function listPages(workspaceId: string): Promise<PageSummary[]> {
    const storage = await getStorage()
    return storage.listPages(workspaceId)
}

/**
 * Get child pages of a parent page.
 */
export async function getChildPages(parentPageId: string): Promise<PageSummary[]> {
    const storage = await getStorage()
    return storage.getChildPages(parentPageId)
}

/**
 * Get root pages (pages without a parent).
 */
export async function getRootPages(workspaceId: string): Promise<PageSummary[]> {
    const allPages = await listPages(workspaceId)
    return allPages.filter(page => page.parentPageId === null)
}

/**
 * Get favorite pages.
 */
export async function getFavoritePages(workspaceId: string): Promise<PageSummary[]> {
    const allPages = await listPages(workspaceId)
    return allPages.filter(page => page.isFavorite)
}

/**
 * Update page title.
 */
export async function updatePageTitle(pageId: string, title: string): Promise<Page> {
    const storage = await getStorage()
    const page = await storage.getPage(pageId)

    if (!page) {
        throw new Error(`Page not found: ${pageId}`)
    }

    const updated: Page = {
        ...page,
        title,
        updatedAt: new Date().toISOString()
    }

    await storage.upsertPage(updated)
    return updated
}

/**
 * Update page content.
 */
export async function updatePageContent(pageId: string, content: BlockContent): Promise<Page> {
    const storage = await getStorage()
    const page = await storage.getPage(pageId)

    if (!page) {
        throw new Error(`Page not found: ${pageId}`)
    }

    const updated: Page = {
        ...page,
        content,
        updatedAt: new Date().toISOString()
    }

    await storage.upsertPage(updated)
    return updated
}

/**
 * Update page (general update).
 */
export async function updatePage(
    pageId: string,
    updates: Partial<Pick<Page, 'title' | 'content' | 'isFavorite' | 'icon' | 'parentPageId' | 'coverImage'>>
): Promise<Page> {
    const storage = await getStorage()
    const page = await storage.getPage(pageId)

    if (!page) {
        throw new Error(`Page not found: ${pageId}`)
    }

    const updated: Page = {
        ...page,
        ...updates,
        updatedAt: new Date().toISOString()
    }

    await storage.upsertPage(updated)
    return updated
}

/**
 * Toggle page favorite status.
 */
export async function togglePageFavorite(pageId: string): Promise<Page> {
    const storage = await getStorage()
    const page = await storage.getPage(pageId)

    if (!page) {
        throw new Error(`Page not found: ${pageId}`)
    }

    const updated: Page = {
        ...page,
        isFavorite: !page.isFavorite,
        updatedAt: new Date().toISOString()
    }

    await storage.upsertPage(updated)
    return updated
}

/**
 * Move page to a new parent.
 */
export async function movePage(pageId: string, newParentPageId: string | null): Promise<Page> {
    const storage = await getStorage()
    const page = await storage.getPage(pageId)

    if (!page) {
        throw new Error(`Page not found: ${pageId}`)
    }

    // Prevent moving page to itself or its descendants
    if (newParentPageId) {
        if (newParentPageId === pageId) {
            throw new Error('Cannot move page to itself')
        }
        if (await isDescendant(pageId, newParentPageId)) {
            throw new Error('Cannot move page to its own descendant')
        }
    }

    const updated: Page = {
        ...page,
        parentPageId: newParentPageId,
        updatedAt: new Date().toISOString()
    }

    await storage.upsertPage(updated)
    return updated
}

/**
 * Check if a page is a descendant of another page.
 */
async function isDescendant(ancestorId: string, pageId: string): Promise<boolean> {
    const storage = await getStorage()
    const page = await storage.getPage(pageId)

    if (!page) return false
    if (page.parentPageId === null) return false
    if (page.parentPageId === ancestorId) return true

    return isDescendant(ancestorId, page.parentPageId)
}

/**
 * Delete a page.
 * By default, also deletes all child pages recursively.
 */
export async function deletePage(
    pageId: string,
    options: { deleteChildren?: boolean } = { deleteChildren: true }
): Promise<{ deletedIds: string[] }> {
    const storage = await getStorage()
    const deletedIds: string[] = []

    if (options.deleteChildren) {
        // Recursively delete children first
        const children = await storage.getChildPages(pageId)
        for (const child of children) {
            const result = await deletePage(child.id, { deleteChildren: true })
            deletedIds.push(...result.deletedIds)
        }
    }

    // Delete the page itself
    await storage.deletePage(pageId)
    deletedIds.push(pageId)

    return { deletedIds }
}

/**
 * Move children of a deleted page to root level.
 */
export async function orphanChildren(pageId: string): Promise<PageSummary[]> {
    const storage = await getStorage()
    const children = await storage.getChildPages(pageId)

    for (const child of children) {
        const fullChild = await storage.getPage(child.id)
        if (fullChild) {
            await storage.upsertPage({
                ...fullChild,
                parentPageId: null,
                updatedAt: new Date().toISOString()
            })
        }
    }

    return children
}

/**
 * Search pages by title and content.
 */
export async function searchPages(workspaceId: string, query: string): Promise<PageSummary[]> {
    const storage = await getStorage()
    return storage.searchPages(workspaceId, query)
}

/**
 * Duplicate a page (without children).
 */
export async function duplicatePage(pageId: string): Promise<Page> {
    const storage = await getStorage()
    const original = await storage.getPage(pageId)

    if (!original) {
        throw new Error(`Page not found: ${pageId}`)
    }

    const now = new Date().toISOString()
    const duplicate: Page = {
        ...original,
        id: uuidv4(),
        title: `${original.title} (copy)`,
        isFavorite: false,
        createdAt: now,
        updatedAt: now
    }

    await storage.upsertPage(duplicate)
    return duplicate
}

/**
 * Build a tree structure from flat page list.
 */
export interface PageTreeNode extends PageSummary {
    children: PageTreeNode[]
}

export function buildPageTree(pages: PageSummary[]): PageTreeNode[] {
    const pageMap = new Map<string, PageTreeNode>()
    const roots: PageTreeNode[] = []

    // Create nodes
    for (const page of pages) {
        pageMap.set(page.id, { ...page, children: [] })
    }

    // Build tree
    for (const page of pages) {
        const node = pageMap.get(page.id)!
        if (page.parentPageId && pageMap.has(page.parentPageId)) {
            pageMap.get(page.parentPageId)!.children.push(node)
        } else {
            roots.push(node)
        }
    }

    // Sort by title
    const sortByTitle = (a: PageTreeNode, b: PageTreeNode) => 
        a.title.localeCompare(b.title)

    const sortTree = (nodes: PageTreeNode[]) => {
        nodes.sort(sortByTitle)
        for (const node of nodes) {
            sortTree(node.children)
        }
    }

    sortTree(roots)
    return roots
}
