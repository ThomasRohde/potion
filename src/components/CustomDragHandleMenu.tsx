/**
 * CustomDragHandleMenu Component
 * 
 * A custom drag handle menu that includes the Turn Into submenu
 * along with the default menu items (Delete, Duplicate, Colors).
 * 
 * Used with BlockNote's SideMenuController to customize the
 * drag handle menu in the block side menu.
 */

import { Block, DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema, PartialBlock } from '@blocknote/core'
import { useBlockNoteEditor, useComponentsContext } from '@blocknote/react'
import { TurnIntoSubmenu } from './TurnIntoSubmenu'

/**
 * Props for CustomDragHandleMenu component.
 */
interface CustomDragHandleMenuProps {
    block: Block<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema>
}

/**
 * Deep clone a block and assign new IDs to it and all nested children.
 * This ensures the duplicated block has unique IDs throughout.
 */
function cloneBlockWithNewIds(
    block: Block<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema>
): PartialBlock<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema> {
    // Clone children recursively, each with new IDs
    const clonedChildren = (block.children || []).map(child => cloneBlockWithNewIds(child))

    // Return block without id (BlockNote will assign a new one)
    // We use a type assertion here because BlockNote's PartialBlock is complex
    return {
        type: block.type,
        props: { ...block.props },
        content: block.content,
        children: clonedChildren
    } as PartialBlock<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema>
}

/**
 * CustomDragHandleMenu - A custom drag handle menu with Turn Into submenu.
 * 
 * Includes:
 * - Delete: Remove the block
 * - Duplicate: Create a copy of the block below
 * - Turn into: Change block type (paragraph, headings, lists)
 */
export function CustomDragHandleMenu({ block }: CustomDragHandleMenuProps) {
    const editor = useBlockNoteEditor()
    const Components = useComponentsContext()!

    const handleDuplicate = () => {
        // Create a deep copy of the block without the id
        const clonedBlock = cloneBlockWithNewIds(block)
        // Insert the duplicate after the current block
        editor.insertBlocks([clonedBlock], block, 'after')
    }

    return (
        <Components.Generic.Menu.Dropdown
            className="bn-menu-dropdown bn-drag-handle-menu"
        >
            {/* Delete block item */}
            <Components.Generic.Menu.Item
                className="bn-menu-item"
                onClick={() => editor.removeBlocks([block])}
            >
                Delete
            </Components.Generic.Menu.Item>

            {/* Duplicate block item */}
            <Components.Generic.Menu.Item
                className="bn-menu-item"
                onClick={handleDuplicate}
            >
                Duplicate
            </Components.Generic.Menu.Item>

            {/* Turn into submenu */}
            <TurnIntoSubmenu block={block}>
                Turn into
            </TurnIntoSubmenu>
        </Components.Generic.Menu.Dropdown>
    )
}

export default CustomDragHandleMenu
