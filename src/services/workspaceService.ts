/**
 * Workspace Service
 * 
 * High-level API for workspace operations.
 * Wraps StorageAdapter methods with business logic.
 */

import { v4 as uuidv4 } from 'uuid'
import { getStorage } from '../storage'
import type { Workspace, Page, BlockContent } from '../types'

const DEFAULT_WORKSPACE_ID = 'default-workspace'
const CURRENT_SCHEMA_VERSION = 1

/**
 * Convert BlockContent to Markdown string.
 * This is a lossy conversion that approximates the content in Markdown format.
 */
export function blockContentToMarkdown(content: BlockContent | undefined): string {
    if (!content || !content.blocks || content.blocks.length === 0) {
        return ''
    }

    const lines: string[] = []

    for (const block of content.blocks) {
        const textContent = extractTextFromBlock(block)
        
        switch (block.type) {
            case 'heading': {
                const level = (block.props?.level as number) || 1
                const prefix = '#'.repeat(Math.min(level, 6))
                lines.push(`${prefix} ${textContent}`)
                lines.push('')
                break
            }
            case 'bulletListItem':
                lines.push(`- ${textContent}`)
                break
            case 'numberedListItem':
                lines.push(`1. ${textContent}`)
                break
            case 'checkListItem': {
                const checked = block.props?.checked ? 'x' : ' '
                lines.push(`- [${checked}] ${textContent}`)
                break
            }
            case 'codeBlock': {
                const language = block.props?.language || ''
                lines.push(`\`\`\`${language}`)
                lines.push(textContent)
                lines.push('```')
                lines.push('')
                break
            }
            case 'image': {
                const url = block.props?.url || ''
                const caption = block.props?.caption || ''
                lines.push(`![${caption}](${url})`)
                lines.push('')
                break
            }
            case 'paragraph':
            default:
                if (textContent) {
                    lines.push(textContent)
                    lines.push('')
                }
                break
        }

        // Recursively handle children
        if (block.children && block.children.length > 0) {
            for (const child of block.children) {
                const childMarkdown = blockContentToMarkdown({ version: 1, blocks: [child] })
                if (childMarkdown.trim()) {
                    // Indent child content
                    const indentedLines = childMarkdown.split('\n').map(line => line ? `  ${line}` : '')
                    lines.push(...indentedLines)
                }
            }
        }
    }

    return lines.join('\n').trim()
}

/**
 * Extract plain text from a block's content.
 */
function extractTextFromBlock(block: BlockContent['blocks'][0]): string {
    if (!block.content || !Array.isArray(block.content)) {
        return ''
    }

    const parts: string[] = []
    for (const item of block.content) {
        if (item.type === 'text') {
            let text = item.text || ''
            // Apply inline styles
            if (item.styles?.bold) text = `**${text}**`
            if (item.styles?.italic) text = `*${text}*`
            if (item.styles?.code) text = `\`${text}\``
            if (item.styles?.strikethrough) text = `~~${text}~~`
            parts.push(text)
        } else if (item.type === 'link') {
            const linkText = item.text || ''
            const href = item.href || ''
            parts.push(`[${linkText}](${href})`)
        }
    }
    return parts.join('')
}

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
 * Creates one if it doesn't exist, along with a Welcome page.
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

        // Only create Welcome page if no pages exist yet
        const existingPages = await storage.listPages(DEFAULT_WORKSPACE_ID)
        if (existingPages.length === 0) {
            const welcomePage = createWelcomePage(DEFAULT_WORKSPACE_ID, now)
            await storage.upsertPage(welcomePage)
        }
    }

    return workspace
}

/**
 * Create a Welcome page with onboarding content.
 */
function createWelcomePage(workspaceId: string, timestamp: string): Page {
    const welcomeContent: BlockContent = {
        version: 1,
        blocks: [
            {
                id: uuidv4(),
                type: 'heading',
                content: [{ type: 'text', text: 'Welcome to Potion! 🧪' }],
                props: { level: 1 }
            },
            {
                id: uuidv4(),
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'Potion is your local-only, privacy-first workspace for notes and databases. All your data stays on your device — nothing is ever sent to a server.'
                }]
            },
            {
                id: uuidv4(),
                type: 'heading',
                content: [{ type: 'text', text: '🔒 Privacy First' }],
                props: { level: 2 }
            },
            {
                id: uuidv4(),
                type: 'bulletListItem',
                content: [{ type: 'text', text: 'Your data is stored locally in your browser using IndexedDB' }]
            },
            {
                id: uuidv4(),
                type: 'bulletListItem',
                content: [{ type: 'text', text: 'No accounts, no cloud sync, no tracking' }]
            },
            {
                id: uuidv4(),
                type: 'bulletListItem',
                content: [{ type: 'text', text: 'Works offline after the first load' }]
            },
            {
                id: uuidv4(),
                type: 'heading',
                content: [{ type: 'text', text: '💾 Backup Your Work' }],
                props: { level: 2 }
            },
            {
                id: uuidv4(),
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'Since data is stored locally, you should regularly export your workspace to keep a backup. Use the export feature to download a JSON file you can import later or on another device.'
                }]
            },
            {
                id: uuidv4(),
                type: 'heading',
                content: [{ type: 'text', text: '✨ Getting Started' }],
                props: { level: 2 }
            },
            {
                id: uuidv4(),
                type: 'numberedListItem',
                content: [{
                    type: 'text',
                    text: 'Create a new page by clicking "+ New page" in the sidebar'
                }]
            },
            {
                id: uuidv4(),
                type: 'numberedListItem',
                content: [{
                    type: 'text',
                    text: 'Use the / command to insert different block types'
                }]
            },
            {
                id: uuidv4(),
                type: 'numberedListItem',
                content: [{
                    type: 'text',
                    text: 'Press Ctrl+K (or Cmd+K on Mac) to quickly search your pages'
                }]
            },
            {
                id: uuidv4(),
                type: 'numberedListItem',
                content: [{
                    type: 'text',
                    text: 'Star pages to add them to your favorites'
                }]
            },

            {
                id: uuidv4(),
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: 'Feel free to delete this page once you\'re familiar with the app. Happy note-taking!'
                }]
            }
        ]
    }

    return {
        id: uuidv4(),
        workspaceId,
        parentPageId: null,
        title: 'Welcome to Potion',
        type: 'page',
        isFavorite: false,
        content: welcomeContent,
        createdAt: timestamp,
        updatedAt: timestamp,
        icon: '👋'
    }
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

/**
 * Export workspace to a JSON file and trigger download.
 * @param workspaceId - The workspace ID to export (defaults to default workspace)
 */
export async function exportWorkspaceToFile(workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<void> {
    const storage = await getStorage()
    const exportData = await storage.exportWorkspace(workspaceId)

    // Format the filename with date
    const date = new Date().toISOString().split('T')[0]
    const filename = `potion-workspace-${date}.json`

    // Create blob and trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Export a single page (and optionally children) to a JSON file.
 * @param pageId - The page ID to export
 * @param includeChildren - Whether to include child pages
 */
export async function exportPageToFile(pageId: string, includeChildren: boolean = true): Promise<void> {
    const storage = await getStorage()
    const exportData = await storage.exportPage(pageId, includeChildren)

    // Get page title for filename
    const page = await storage.getPage(pageId)
    const title = page?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() ?? 'page'
    const date = new Date().toISOString().split('T')[0]
    const filename = `potion-${title}-${date}.json`

    // Create blob and trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Export a single page to a Markdown file.
 * This is a lossy conversion - some block types may not convert perfectly.
 * @param pageId - The page ID to export
 */
export async function exportPageAsMarkdown(pageId: string): Promise<void> {
    const storage = await getStorage()
    const page = await storage.getPage(pageId)

    if (!page) {
        throw new Error(`Page not found: ${pageId}`)
    }

    // Build markdown content
    const lines: string[] = []

    // Add title as H1
    lines.push(`# ${page.title || 'Untitled'}`)
    lines.push('')

    // Convert block content to markdown
    if (page.content) {
        const contentMarkdown = blockContentToMarkdown(page.content)
        if (contentMarkdown) {
            lines.push(contentMarkdown)
        }
    }

    const markdown = lines.join('\n')

    // Get page title for filename
    const title = page.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() ?? 'page'
    const filename = `${title}.md`

    // Create blob and trigger download
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Import workspace from a JSON file.
 * @param file - The file to import
 * @param mode - 'replace' clears existing data, 'merge' combines with existing
 * @returns Import result with statistics and conflicts
 */
export async function importWorkspaceFromFile(
    file: File,
    mode: 'replace' | 'merge' = 'replace'
): Promise<{
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
}> {
    const storage = await getStorage()

    try {
        const text = await file.text()
        const data = JSON.parse(text)

        // Basic validation
        if (!data.version || !data.workspace || !Array.isArray(data.pages)) {
            throw new Error('Invalid export file format')
        }

        const result = await storage.importWorkspace(DEFAULT_WORKSPACE_ID, data, mode)

        return {
            success: result.success,
            pagesAdded: result.pagesAdded,
            pagesUpdated: result.pagesUpdated,
            conflicts: result.conflicts,
            errors: result.errors
        }
    } catch (error) {
        return {
            success: false,
            pagesAdded: 0,
            pagesUpdated: 0,
            conflicts: [],
            errors: [error instanceof Error ? error.message : String(error)]
        }
    }
}

/**
 * Validate an export file without importing it.
 * @param file - The file to validate
 * @returns Validation result with summary
 */
export async function validateExportFile(file: File): Promise<{
    valid: boolean
    version: number | null
    pageCount: number
    workspaceName: string | null
    exportedAt: string | null
    errors: string[]
}> {
    try {
        const text = await file.text()
        const data = JSON.parse(text)

        const errors: string[] = []

        if (typeof data.version !== 'number') {
            errors.push('Missing or invalid version field')
        }
        if (!data.workspace || typeof data.workspace.name !== 'string') {
            errors.push('Missing or invalid workspace field')
        }
        if (!Array.isArray(data.pages)) {
            errors.push('Missing or invalid pages array')
        }

        return {
            valid: errors.length === 0,
            version: data.version ?? null,
            pageCount: Array.isArray(data.pages) ? data.pages.length : 0,
            workspaceName: data.workspace?.name ?? null,
            exportedAt: data.exportedAt ?? null,
            errors
        }
    } catch (error) {
        return {
            valid: false,
            version: null,
            pageCount: 0,
            workspaceName: null,
            exportedAt: null,
            errors: [error instanceof Error ? error.message : 'Failed to parse file']
        }
    }
}
