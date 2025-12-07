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
 * - @ mentions for linking to other pages (F069)
 */

import { useEffect, useMemo, useCallback } from 'react'
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
    BlockTypeSelect,
    SuggestionMenuController,
    DefaultReactSuggestionItem,
    getDefaultReactSlashMenuItems
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { BlockNoteSchema, createCodeBlockSpec, defaultInlineContentSpecs } from '@blocknote/core'
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from '@blocknote/core/extensions'
import type { Block } from '@blocknote/core'
import { codeBlockOptions } from '@blocknote/code-block'
import '@blocknote/mantine/style.css'

import type { BlockContent, PageSummary } from '../types'
import { CustomDragHandleMenu } from './CustomDragHandleMenu'
import { useThemeStore, selectAppliedTheme } from '../stores/themeStore'
import { PageMention } from './PageMention'
import { Callout, insertCalloutItem } from './CalloutBlock'

/**
 * Custom schema with code block syntax highlighting, page mentions, and callout blocks.
 * This extends BlockNote's default schema with additional features.
 */
const schema = BlockNoteSchema.create({
    inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        pageMention: PageMention
    }
}).extend({
    blockSpecs: {
        codeBlock: createCodeBlockSpec(codeBlockOptions),
        callout: Callout()
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
    'codeBlock',
    'callout'
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

    /**
     * List of pages for @ mentions feature.
     * Used to show page suggestions when user types @.
     */
    pages?: PageSummary[]
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
    readOnly = false,
    pages = []
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
    const editor = useCreateBlockNote({
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

    // Get mention items from pages list for @ suggestion menu
    const getMentionItems = useCallback(
        (query: string): DefaultReactSuggestionItem[] => {
            const items = pages.map((page) => ({
                title: page.title || 'Untitled',
                onItemClick: () => {
                    editor.insertInlineContent([
                        {
                            type: 'pageMention',
                            props: {
                                pageId: page.id,
                                pageTitle: page.title || 'Untitled'
                            }
                        },
                        ' ' // Add space after mention
                    ])
                }
            }))
            return filterSuggestionItems(items, query)
        },
        [editor, pages]
    )

    // Get slash menu items including custom callout block
    const getSlashMenuItems = useCallback(
        async (query: string): Promise<DefaultReactSuggestionItem[]> => {
            // Get default slash menu items
            const defaultItems = getDefaultReactSlashMenuItems(editor)
            
            // Find index of last item in "Basic blocks" group
            let lastBasicBlockIndex = -1
            for (let i = defaultItems.length - 1; i >= 0; i--) {
                if (defaultItems[i].group === 'Basic blocks') {
                    lastBasicBlockIndex = i
                    break
                }
            }
            
            // Create callout insertion item
            const calloutItem: DefaultReactSuggestionItem = {
                title: insertCalloutItem.title,
                subtext: insertCalloutItem.subtext,
                onItemClick: () => {
                    insertOrUpdateBlockForSlashMenu(editor, {
                        type: 'callout',
                    })
                },
                aliases: insertCalloutItem.aliases,
                group: insertCalloutItem.group
            }
            
            // Insert callout item after last basic block (or at end if not found)
            if (lastBasicBlockIndex >= 0) {
                defaultItems.splice(lastBasicBlockIndex + 1, 0, calloutItem)
            } else {
                defaultItems.push(calloutItem)
            }
            
            return filterSuggestionItems(defaultItems, query)
        },
        [editor]
    )

    // Handle content changes
    useEffect(() => {
        if (!onChange || readOnly) return

        // Subscribe to document changes
        const unsubscribe = editor.onChange(() => {
            // Cast to Block[] for our internal format - safe because we control the schema
            const blocks = editor.document as unknown as Block[]
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
                slashMenu={false}
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
                {/* Custom slash menu with callout block */}
                <SuggestionMenuController
                    triggerCharacter="/"
                    getItems={getSlashMenuItems}
                />
                {/* @ mentions suggestion menu for linking to pages */}
                <SuggestionMenuController
                    triggerCharacter="@"
                    getItems={async (query) =>
                        filterSuggestionItems(getMentionItems(query), query)
                    }
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
