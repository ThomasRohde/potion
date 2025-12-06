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
 * Convert our internal block content format to BlockNote blocks.
 * Returns undefined for empty/invalid content to let BlockNote use its default.
 */
function toBlockNoteBlocks(content: BlockContent | undefined): Block[] | undefined {
    if (!content || !content.blocks || content.blocks.length === 0) {
        return undefined
    }

    // Validate and transform blocks to BlockNote format
    const validBlocks: Block[] = []
    for (const block of content.blocks) {
        // Skip invalid blocks
        if (!block || typeof block !== 'object') {
            continue
        }
        
        // Ensure block has required properties
        if (!block.id || !block.type) {
            continue
        }

        // Transform to BlockNote format
        // We use unknown cast because BlockNote's type is very strict
        // but we're doing runtime validation
        const blockNoteBlock = {
            id: block.id,
            type: block.type,
            // BlockNote requires these default props
            props: {
                textColor: 'default',
                backgroundColor: 'default',
                textAlignment: 'left',
                // Merge any custom props (like level for headings)
                ...(block.props || {})
            },
            // Ensure content is an array (BlockNote requires this)
            content: Array.isArray(block.content) ? block.content : [],
            // Ensure children is an array
            children: Array.isArray(block.children) 
                ? toBlockNoteBlocks({ version: 1, blocks: block.children }) || []
                : []
        } as unknown as Block

        validBlocks.push(blockNoteBlock)
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
