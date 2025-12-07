/**
 * TurnIntoSubmenu Component
 * 
 * A custom drag handle menu item that provides a submenu for changing
 * block types. This allows users to convert existing blocks to different
 * types (paragraph, headings, lists, etc.) while preserving content.
 * 
 * Uses BlockNote's editor.updateBlock() API to change block types.
 */

import { SideMenuExtension } from '@blocknote/core/extensions'
import {
    useBlockNoteEditor,
    useComponentsContext,
    useExtensionState
} from '@blocknote/react'
import { ReactNode, useMemo } from 'react'
import {
    RiArrowRightSLine,
    RiH1,
    RiH2,
    RiH3,
    RiListCheck3,
    RiListOrdered,
    RiListUnordered,
    RiText
} from 'react-icons/ri'

/**
 * Block types that can be converted to using Turn Into.
 * Each type has a name, type identifier, optional props, and icon.
 */
interface TurnIntoItem {
    name: string
    type: 'paragraph' | 'heading' | 'bulletListItem' | 'numberedListItem' | 'checkListItem' | 'toggleListItem'
    props?: Record<string, string | number | boolean>
    icon: ReactNode
}

/**
 * Get the list of block types available for Turn Into.
 * These are text-based block types that support content conversion.
 */
function getTurnIntoItems(): TurnIntoItem[] {
    return [
        {
            name: 'Paragraph',
            type: 'paragraph',
            icon: <RiText size={18} />
        },
        {
            name: 'Heading 1',
            type: 'heading',
            props: { level: 1, isToggleable: false },
            icon: <RiH1 size={18} />
        },
        {
            name: 'Heading 2',
            type: 'heading',
            props: { level: 2, isToggleable: false },
            icon: <RiH2 size={18} />
        },
        {
            name: 'Heading 3',
            type: 'heading',
            props: { level: 3, isToggleable: false },
            icon: <RiH3 size={18} />
        },
        {
            name: 'Toggle Heading 1',
            type: 'heading',
            props: { level: 1, isToggleable: true },
            icon: <RiH1 size={18} />
        },
        {
            name: 'Toggle Heading 2',
            type: 'heading',
            props: { level: 2, isToggleable: true },
            icon: <RiH2 size={18} />
        },
        {
            name: 'Toggle Heading 3',
            type: 'heading',
            props: { level: 3, isToggleable: true },
            icon: <RiH3 size={18} />
        },
        {
            name: 'Bullet List',
            type: 'bulletListItem',
            icon: <RiListUnordered size={18} />
        },
        {
            name: 'Numbered List',
            type: 'numberedListItem',
            icon: <RiListOrdered size={18} />
        },
        {
            name: 'Checklist',
            type: 'checkListItem',
            icon: <RiListCheck3 size={18} />
        },
        {
            name: 'Toggle List',
            type: 'toggleListItem',
            icon: <RiArrowRightSLine size={18} />
        }
    ]
}

/**
 * Props for TurnIntoSubmenu component.
 */
interface TurnIntoSubmenuProps {
    children: ReactNode
}

/**
 * TurnIntoSubmenu - A submenu item for the drag handle menu
 * that allows changing the current block's type.
 */
export function TurnIntoSubmenu({ children }: TurnIntoSubmenuProps) {
    const editor = useBlockNoteEditor()
    const Components = useComponentsContext()!

    // Get the block from the side menu extension state
    const block = useExtensionState(SideMenuExtension, {
        selector: (state) => state?.block
    })

    const turnIntoItems = useMemo(() => getTurnIntoItems(), [])

    // Find the currently selected item based on block type and props
    const selectedItem = useMemo(() => {
        if (!block) return null

        return turnIntoItems.find((item) => {
            const typesMatch = item.type === block.type
            if (!typesMatch) return false

            // For headings, also check the level prop
            if (item.props) {
                const propsMatch = Object.entries(item.props).every(
                    ([propName, propValue]) =>
                        (block.props as Record<string, unknown>)?.[propName] === propValue
                )
                return propsMatch
            }

            return true
        })
    }, [block, turnIntoItems])

    // Only show for convertible block types (text-based blocks)
    const convertibleTypes = new Set([
        'paragraph',
        'heading',
        'bulletListItem',
        'numberedListItem',
        'checkListItem',
        'toggleListItem'
    ])

    if (!block || !convertibleTypes.has(block.type)) {
        return null
    }

    return (
        <Components.Generic.Menu.Root position="right" sub={true}>
            <Components.Generic.Menu.Trigger sub={true}>
                <Components.Generic.Menu.Item
                    className="bn-menu-item"
                    subTrigger={true}
                >
                    {children}
                </Components.Generic.Menu.Item>
            </Components.Generic.Menu.Trigger>

            <Components.Generic.Menu.Dropdown
                sub={true}
                className="bn-menu-dropdown bn-turn-into-dropdown"
            >
                {turnIntoItems.map((item) => {
                    const isSelected = selectedItem?.name === item.name

                    return (
                        <Components.Generic.Menu.Item
                            key={item.name}
                            className="bn-menu-item"
                            onClick={() => {
                                editor.updateBlock(block, {
                                    type: item.type,
                                    props: item.props
                                })
                            }}
                            icon={item.icon}
                        >
                            <span className="flex items-center gap-2">
                                {item.name}
                                {isSelected && (
                                    <span className="text-blue-500 ml-auto">✓</span>
                                )}
                            </span>
                        </Components.Generic.Menu.Item>
                    )
                })}
            </Components.Generic.Menu.Dropdown>
        </Components.Generic.Menu.Root>
    )
}

export default TurnIntoSubmenu
