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

import { useEffect, useMemo, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import type { Block, BlockNoteEditor } from '@blocknote/core'
import '@blocknote/mantine/style.css'

import type { BlockContent } from '../types'

/**
 * BlockNote's default supported block types.
 * Blocks with types not in this list will be skipped to prevent "node type not found" errors.
 */
const SUPPORTED_BLOCK_TYPES = new Set([
    'paragraph',
    'heading',
    'bulletListItem',
    'numberedListItem',
    'checkListItem',
    'toggleListItem',
    'table',
    'image',
    'video',
    'audio',
    'file',
    'codeBlock'
])

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
 * Transform inline content item to ensure it has all required BlockNote properties.
 * BlockNote's StyledText requires: { type: 'text', text: string, styles: {} }
 * BlockNote's Link requires: { type: 'link', content: StyledText[], href: string }
 */
function transformInlineContent(item: unknown): unknown | null {
    if (!item || typeof item !== 'object') {
        return null
    }

    const i = item as Record<string, unknown>

    if (!i.type || typeof i.type !== 'string') {
        return null
    }

    if (i.type === 'text') {
        // StyledText: ensure styles is an object
        return {
            type: 'text',
            text: typeof i.text === 'string' ? i.text : '',
            styles: (i.styles && typeof i.styles === 'object' && !Array.isArray(i.styles))
                ? i.styles
                : {}
        }
    } else if (i.type === 'link') {
        // Link: ensure content is array of StyledText and href is string
        const linkContent: unknown[] = []
        if (Array.isArray(i.content)) {
            for (const c of i.content) {
                const transformed = transformInlineContent(c)
                if (transformed) {
                    linkContent.push(transformed)
                }
            }
        }
        return {
            type: 'link',
            content: linkContent,
            href: typeof i.href === 'string' ? i.href : ''
        }
    } else {
        // CustomInlineContent: ensure props is an object
        const content: unknown[] = []
        if (Array.isArray(i.content)) {
            for (const c of i.content) {
                const transformed = transformInlineContent(c)
                if (transformed) {
                    content.push(transformed)
                }
            }
        }
        return {
            type: i.type,
            content: content.length > 0 ? content : undefined,
            props: (i.props && typeof i.props === 'object' && !Array.isArray(i.props))
                ? i.props
                : {}
        }
    }
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
    if (!b.id || typeof b.id !== 'string') {
        return null
    }

    if (!b.type || typeof b.type !== 'string') {
        return null
    }

    // Skip unsupported block types to prevent "node type not found" errors
    if (!SUPPORTED_BLOCK_TYPES.has(b.type)) {
        // Convert unsupported types to paragraph to preserve content
        b.type = 'paragraph'
    }

    // Safely extract and sanitize props - MUST be a valid object, never null/undefined
    const safeProps: Record<string, unknown> = {
        textColor: 'default',
        backgroundColor: 'default',
        textAlignment: 'left'
    }

    // Only merge props if it's a valid non-null object
    if (b.props !== null && b.props !== undefined && typeof b.props === 'object' && !Array.isArray(b.props)) {
        const existingProps = b.props as Record<string, unknown>
        for (const key of Object.keys(existingProps)) {
            const value = existingProps[key]
            // Only copy defined, non-null values
            if (value !== undefined && value !== null) {
                safeProps[key] = value
            }
        }
    }

    // Safely extract content - must be an array of valid inline content objects
    const safeContent: unknown[] = []
    if (Array.isArray(b.content)) {
        for (const item of b.content) {
            const transformedItem = transformInlineContent(item)
            if (transformedItem) {
                safeContent.push(transformedItem)
            }
        }
    }

    // Recursively transform children - MUST be an array, never undefined
    const safeChildren: Block[] = []
    if (Array.isArray(b.children)) {
        for (const child of b.children) {
            const transformedChild = transformBlock(child)
            if (transformedChild) {
                safeChildren.push(transformedChild)
            }
        }
    }

    // Create the block with all required properties explicitly set
    const result: Record<string, unknown> = {
        id: b.id,
        type: b.type,
        props: safeProps,
        content: safeContent,
        children: safeChildren
    }

    return result as Block
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

/**
 * Detect if text content looks like markdown.
 * Returns true if the text contains common markdown patterns.
 */
function looksLikeMarkdown(text: string): boolean {
    // Common markdown patterns to detect
    const markdownPatterns = [
        /^#{1,6}\s+/m,           // Headings: # ## ### etc.
        /\*\*[^*]+\*\*/,         // Bold: **text**
        /\*[^*]+\*/,             // Italic: *text*
        /__[^_]+__/,             // Bold: __text__
        /_[^_]+_/,               // Italic: _text_
        /\[.+\]\(.+\)/,          // Links: [text](url)
        /^[-*+]\s+/m,            // Unordered lists: - item or * item
        /^\d+\.\s+/m,            // Ordered lists: 1. item
        /^>\s+/m,                // Blockquotes: > text
        /`[^`]+`/,               // Inline code: `code`
        /^```/m,                 // Code blocks: ```
        /^\|.+\|$/m,             // Tables: |col1|col2|
        /!\[.+\]\(.+\)/,         // Images: ![alt](url)
    ]

    return markdownPatterns.some(pattern => pattern.test(text))
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

    // Ref for the editor container to attach paste handler
    const containerRef = useRef<HTMLDivElement>(null)

    // Create the BlockNote editor instance
    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialBlocks,
        defaultStyles: true
    })

    /**
     * Handle paste events to detect and convert markdown content.
     * This effect attaches a paste handler to intercept clipboard events.
     */
    useEffect(() => {
        const container = containerRef.current
        if (!container || readOnly) return

        const handlePaste = async (event: ClipboardEvent) => {
            const clipboardData = event.clipboardData
            if (!clipboardData) return

            // Get plain text from clipboard
            const plainText = clipboardData.getData('text/plain')
            if (!plainText) return

            // If we have HTML content, let BlockNote handle it natively
            const hasHtml = clipboardData.types.includes('text/html')
            if (hasHtml) return

            // If the text looks like markdown, parse and insert it
            if (looksLikeMarkdown(plainText)) {
                // Prevent default paste behavior
                event.preventDefault()
                event.stopPropagation()

                try {
                    // Parse markdown to blocks
                    const blocks = await editor.tryParseMarkdownToBlocks(plainText)
                    
                    console.log('Parsed markdown blocks:', blocks)

                    if (blocks.length > 0) {
                        // Get current cursor position
                        const cursorPos = editor.getTextCursorPosition()

                        if (cursorPos && cursorPos.block) {
                            // Check if current block is empty - if so, replace it
                            const currentBlock = cursorPos.block
                            const isEmptyBlock = !currentBlock.content || 
                                (Array.isArray(currentBlock.content) && currentBlock.content.length === 0) ||
                                (Array.isArray(currentBlock.content) && currentBlock.content.every(
                                    (c: { type: string; text?: string }) => c.type === 'text' && (!c.text || c.text.trim() === '')
                                ))
                            
                            if (isEmptyBlock) {
                                // Replace the empty block with the parsed blocks
                                editor.replaceBlocks([currentBlock], blocks)
                            } else {
                                // Insert parsed blocks after the current block
                                editor.insertBlocks(blocks, cursorPos.block, 'after')
                            }
                        } else {
                            // If no cursor position, append to document
                            const lastBlock = editor.document[editor.document.length - 1]
                            if (lastBlock) {
                                editor.insertBlocks(blocks, lastBlock, 'after')
                            }
                        }
                    }
                } catch (err) {
                    // If markdown parsing fails, let the default paste happen
                    console.warn('Markdown paste parsing failed, falling back to plain text:', err)
                    // Insert as plain text since we prevented default
                    const textContent = [{
                        type: 'paragraph' as const,
                        content: [{ type: 'text' as const, text: plainText, styles: {} }]
                    }]
                    const cursorPos = editor.getTextCursorPosition()
                    if (cursorPos && cursorPos.block) {
                        editor.insertBlocks(textContent, cursorPos.block, 'after')
                    }
                }
            }
        }

        // Use capture phase to intercept before BlockNote handles it
        container.addEventListener('paste', handlePaste, { capture: true })

        return () => {
            container.removeEventListener('paste', handlePaste, { capture: true })
        }
    }, [editor, readOnly])

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
        <div ref={containerRef} className="rich-text-editor">
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
