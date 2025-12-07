/**
 * CustomDragHandleMenu Component
 * 
 * A custom drag handle menu that includes the Turn Into submenu
 * along with the default menu items (Delete, Duplicate, Colors).
 * 
 * Used with BlockNote's SideMenuController to customize the
 * drag handle menu in the block side menu.
 */

import { PartialBlock } from '@blocknote/core'
import { SideMenuExtension } from '@blocknote/core/extensions'
import {
    useBlockNoteEditor,
    useComponentsContext,
    useExtensionState,
    DragHandleMenu,
    RemoveBlockItem,
    BlockColorsItem
} from '@blocknote/react'
import { TurnIntoSubmenu } from './TurnIntoSubmenu'

/**
 * Deep clone a block and assign new IDs to it and all nested children.
 * This ensures the duplicated block has unique IDs throughout.
 */
function cloneBlockWithNewIds(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    block: any
): PartialBlock {
    // Clone children recursively, each with new IDs
    const clonedChildren = (block.children || []).map((child: unknown) => cloneBlockWithNewIds(child))

    // Return block without id (BlockNote will assign a new one)
    return {
        type: block.type,
        props: { ...block.props },
        content: block.content,
        children: clonedChildren
    } as PartialBlock
}

/**
 * CustomDragHandleMenu - A custom drag handle menu with Turn Into submenu.
 * 
 * Includes:
 * - Delete: Remove the block
 * - Duplicate: Create a copy of the block below
 * - Colors: Change block text/background color
 * - Turn into: Change block type (paragraph, headings, lists)
 */
export function CustomDragHandleMenu() {
    const editor = useBlockNoteEditor()
    const Components = useComponentsContext()!

    // Get the block from the side menu extension state
    const block = useExtensionState(SideMenuExtension, {
        selector: (state) => state?.block
    })

    if (!block) {
        return null
    }

    const handleDuplicate = () => {
        // Create a deep copy of the block without the id
        const clonedBlock = cloneBlockWithNewIds(block)
        // Insert the duplicate after the current block
        editor.insertBlocks([clonedBlock], block, 'after')
    }

    return (
        <DragHandleMenu>
            {/* Delete block item - uses internal block from context */}
            <RemoveBlockItem>
                Delete
            </RemoveBlockItem>

            {/* Duplicate block item */}
            <Components.Generic.Menu.Item
                className="bn-menu-item"
                onClick={handleDuplicate}
            >
                Duplicate
            </Components.Generic.Menu.Item>

            {/* Colors submenu - uses internal block from context */}
            <BlockColorsItem>
                Colors
            </BlockColorsItem>

            {/* Turn into submenu */}
            <TurnIntoSubmenu>
                Turn into
            </TurnIntoSubmenu>
        </DragHandleMenu>
    )
}

export default CustomDragHandleMenu
