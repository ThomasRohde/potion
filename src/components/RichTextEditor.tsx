/**
 * RichTextEditor Component
 * 
 * Wrapper around BlockNote editor that abstracts the implementation.
 * This allows the app to be decoupled from the specific editor library.
 * 
 * Features:
 * - Renders BlockNote editor in the content area
 * - Handles content serialization/deserialization
 * - Provides onChange callback for auto-save integration
 */

import { useEffect, useMemo } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import type { Block, BlockNoteEditor } from '@blocknote/core'
import '@blocknote/mantine/style.css'

import type { BlockContent } from '../types'

export interface RichTextEditorProps {
    /**
     * Initial content to load into the editor.
     * If undefined, editor starts empty.
     */
    initialContent?: BlockContent

    /**
     * Called when the editor content changes.
     * The callback receives the new content in our internal format.
     */
    onChange?: (content: BlockContent) => void

    /**
     * Whether the editor is read-only.
     */
    readOnly?: boolean

    /**
     * Placeholder text when editor is empty.
     */
    placeholder?: string
}

/**
 * Safely transform a single block to BlockNote format.
 * Handles all edge cases for props, content, and children.
 */
function transformBlock(block: unknown): Block | null {
    // Skip invalid blocks
    if (!block || typeof block !== 'object') {
        return null
    }

    const b = block as Record<string, unknown>

    // Ensure block has required properties
    if (!b.id || typeof b.id !== 'string' || !b.type || typeof b.type !== 'string') {
        return null
    }

    // Safely extract and sanitize props - MUST be a valid object
    let safeProps: Record<string, unknown> = {
        textColor: 'default',
        backgroundColor: 'default',
        textAlignment: 'left'
    }

    // Only merge props if it's a valid non-null object
    if (b.props && typeof b.props === 'object' && !Array.isArray(b.props)) {
        const existingProps = b.props as Record<string, unknown>
        for (const [key, value] of Object.entries(existingProps)) {
            // Only copy defined, non-null values
            if (value !== undefined && value !== null) {
                safeProps[key] = value
            }
        }
    }

    // Safely extract content - must be an array
    let safeContent: unknown[] = []
    if (Array.isArray(b.content)) {
        safeContent = b.content.filter((item): item is object =>
            item !== null && item !== undefined && typeof item === 'object'
        )
    }

    // Recursively transform children
    let safeChildren: Block[] = []
    if (Array.isArray(b.children)) {
        for (const child of b.children) {
            const transformedChild = transformBlock(child)
            if (transformedChild) {
                safeChildren.push(transformedChild)
            }
        }
    }

    return {
        id: b.id as string,
        type: b.type as string,
        props: safeProps,
        content: safeContent,
        children: safeChildren
    } as Block
}

/**
 * Convert our internal block content format to BlockNote blocks.
 * Returns undefined for empty/invalid content to let BlockNote use its default.
 */
function toBlockNoteBlocks(content: BlockContent | undefined): Block[] | undefined {
    if (!content || !content.blocks || !Array.isArray(content.blocks) || content.blocks.length === 0) {
        return undefined
    }

    // Validate and transform blocks to BlockNote format
    const validBlocks: Block[] = []
    for (const block of content.blocks) {
        const transformed = transformBlock(block)
        if (transformed) {
            validBlocks.push(transformed)
        }
    }

    // Return undefined if no valid blocks (let BlockNote use default empty state)
    if (validBlocks.length === 0) {
        return undefined
    }

    return validBlocks
}

/**
 * Convert BlockNote blocks to our internal format.
 */
function fromBlockNoteBlocks(blocks: Block[]): BlockContent {
    return {
        version: 1,
        blocks: blocks as BlockContent['blocks']
    }
}

export function RichTextEditor({
    initialContent,
    onChange,
    readOnly = false
}: RichTextEditorProps) {
    // Convert initial content to BlockNote format
    const initialBlocks = useMemo(
        () => toBlockNoteBlocks(initialContent),
        [initialContent]
    )

    // Create the BlockNote editor instance
    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialBlocks,
        defaultStyles: true
    })

    // Handle content changes
    useEffect(() => {
        if (!onChange || readOnly) return

        // Subscribe to document changes
        const unsubscribe = editor.onChange(() => {
            const blocks = editor.document
            const content = fromBlockNoteBlocks(blocks)
            onChange(content)
        })

        return unsubscribe
    }, [editor, onChange, readOnly])

    return (
        <div className="rich-text-editor">
            <BlockNoteView
                editor={editor}
                editable={!readOnly}
                theme="light"
            />
        </div>
    )
}

/**
 * Create empty content in our internal format.
 * This is the canonical way to create new page content.
 */
export function createEmptyEditorContent(): BlockContent {
    return {
        version: 1,
        blocks: []
    }
}
