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
 * - Native markdown paste support via BlockNote's pasteHandler
 * - Code block syntax highlighting with language selector
 */

import { useEffect, useMemo } from 'react'
import {
    useCreateBlockNote,
    SideMenuController,
    SideMenu,
    FormattingToolbarController,
    FormattingToolbar,
    BasicTextStyleButton,
    TextAlignButton,
    ColorStyleButton,
    NestBlockButton,
    UnnestBlockButton,
    CreateLinkButton,
    BlockTypeSelect
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import type { Block, BlockNoteEditor } from '@blocknote/core'
import { codeBlockOptions } from '@blocknote/code-block'
import '@blocknote/mantine/style.css'

import type { BlockContent } from '../types'
import { CustomDragHandleMenu } from './CustomDragHandleMenu'
import { useThemeStore, selectAppliedTheme } from '../stores/themeStore'

/**
 * Custom schema with code block syntax highlighting enabled.
 * This extends BlockNote's default schema with the configured code block.
 */
const schema = BlockNoteSchema.create().extend({
    blockSpecs: {
        codeBlock: createCodeBlockSpec(codeBlockOptions)
    }
})

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

export function RichTextEditor({
    initialContent,
    onChange,
    readOnly = false
}: RichTextEditorProps) {
    // Get the current theme from the store
    const appliedTheme = useThemeStore(selectAppliedTheme)

    // Convert initial content to BlockNote format
    const initialBlocks = useMemo(
        () => toBlockNoteBlocks(initialContent),
        [initialContent]
    )

    // Create the BlockNote editor instance with native markdown paste support
    // and code block syntax highlighting
    const editor: BlockNoteEditor = useCreateBlockNote({
        schema,
        initialContent: initialBlocks,
        defaultStyles: true,
        // Use BlockNote's native paste handler with markdown support
        // This interprets plain text as markdown and converts it to rich text
        pasteHandler: ({ defaultPasteHandler }) => {
            // Use the default handler with plainTextAsMarkdown enabled
            // This makes pasting markdown "just work" without custom logic
            return defaultPasteHandler({
                plainTextAsMarkdown: true,
                prioritizeMarkdownOverHTML: false
            })
        }
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
                theme={appliedTheme}
                sideMenu={false}
                formattingToolbar={false}
            >
                {/* Custom side menu with Turn Into submenu */}
                <SideMenuController
                    sideMenu={(props) => (
                        <SideMenu
                            {...props}
                            dragHandleMenu={CustomDragHandleMenu}
                        />
                    )}
                />
                {/* Custom formatting toolbar with text alignment buttons */}
                <FormattingToolbarController
                    formattingToolbar={() => (
                        <FormattingToolbar>
                            <BlockTypeSelect key="blockTypeSelect" />

                            <BasicTextStyleButton basicTextStyle="bold" key="boldStyleButton" />
                            <BasicTextStyleButton basicTextStyle="italic" key="italicStyleButton" />
                            <BasicTextStyleButton basicTextStyle="underline" key="underlineStyleButton" />
                            <BasicTextStyleButton basicTextStyle="strike" key="strikeStyleButton" />
                            <BasicTextStyleButton basicTextStyle="code" key="codeStyleButton" />

                            <TextAlignButton textAlignment="left" key="textAlignLeftButton" />
                            <TextAlignButton textAlignment="center" key="textAlignCenterButton" />
                            <TextAlignButton textAlignment="right" key="textAlignRightButton" />
                            <TextAlignButton textAlignment="justify" key="textAlignJustifyButton" />

                            <ColorStyleButton key="colorStyleButton" />
                            <NestBlockButton key="nestBlockButton" />
                            <UnnestBlockButton key="unnestBlockButton" />
                            <CreateLinkButton key="createLinkButton" />
                        </FormattingToolbar>
                    )}
                />
            </BlockNoteView>
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
