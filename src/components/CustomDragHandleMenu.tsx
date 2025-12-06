/**
 * CustomDragHandleMenu Component
 * 
 * A custom drag handle menu that includes the Turn Into submenu
 * along with the default menu items (Delete, Colors).
 * 
 * Used with BlockNote's SideMenuController to customize the
 * drag handle menu in the block side menu.
 */

import { Block, DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema } from '@blocknote/core'
import { useBlockNoteEditor, useComponentsContext } from '@blocknote/react'
import { TurnIntoSubmenu } from './TurnIntoSubmenu'

/**
 * Props for CustomDragHandleMenu component.
 */
interface CustomDragHandleMenuProps {
    block: Block<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema>
}

/**
 * CustomDragHandleMenu - A custom drag handle menu with Turn Into submenu.
 * 
 * Includes:
 * - Delete: Remove the block
 * - Turn into: Change block type (paragraph, headings, lists)
 */
export function CustomDragHandleMenu({ block }: CustomDragHandleMenuProps) {
    const editor = useBlockNoteEditor()
    const Components = useComponentsContext()!

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

            {/* Turn into submenu */}
            <TurnIntoSubmenu block={block}>
                Turn into
            </TurnIntoSubmenu>
        </Components.Generic.Menu.Dropdown>
    )
}

export default CustomDragHandleMenu
