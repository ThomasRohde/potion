/**
 * CalloutBlock Component (F059)
 * 
 * Custom block type for callout/alert blocks with different types.
 * Based on BlockNote's createReactBlockSpec API.
 */

import { defaultProps } from '@blocknote/core'
import { createReactBlockSpec } from '@blocknote/react'
import { 
    Info, 
    AlertTriangle, 
    AlertCircle, 
    CheckCircle,
    type LucideIcon 
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'

/**
 * The types of callouts that users can choose from.
 */
export const calloutTypes = [
    {
        title: 'Info',
        value: 'info' as const,
        icon: Info,
        color: 'hsl(var(--primary))',
        backgroundColor: {
            light: 'hsl(var(--primary) / 0.1)',
            dark: 'hsl(var(--primary) / 0.2)',
        },
    },
    {
        title: 'Warning',
        value: 'warning' as const,
        icon: AlertTriangle,
        color: '#e69819',
        backgroundColor: {
            light: 'rgba(230, 152, 25, 0.1)',
            dark: 'rgba(230, 152, 25, 0.2)',
        },
    },
    {
        title: 'Error',
        value: 'error' as const,
        icon: AlertCircle,
        color: '#d80d0d',
        backgroundColor: {
            light: 'rgba(216, 13, 13, 0.1)',
            dark: 'rgba(216, 13, 13, 0.2)',
        },
    },
    {
        title: 'Success',
        value: 'success' as const,
        icon: CheckCircle,
        color: '#0bc10b',
        backgroundColor: {
            light: 'rgba(11, 193, 11, 0.1)',
            dark: 'rgba(11, 193, 11, 0.2)',
        },
    },
] as const

export type CalloutType = (typeof calloutTypes)[number]['value']

/**
 * The Callout block specification.
 * Creates a styled callout with an icon and editable content.
 */
export const Callout = createReactBlockSpec(
    {
        type: 'callout',
        propSchema: {
            textAlignment: defaultProps.textAlignment,
            textColor: defaultProps.textColor,
            type: {
                default: 'info' as CalloutType,
                values: ['info', 'warning', 'error', 'success'] as const,
            },
        },
        content: 'inline',
    },
    {
        render: (props) => {
            const calloutType = calloutTypes.find(
                (c) => c.value === props.block.props.type
            )!
            const Icon: LucideIcon = calloutType.icon
            const isDark = document.documentElement.classList.contains('dark')
            const bgColor = isDark 
                ? calloutType.backgroundColor.dark 
                : calloutType.backgroundColor.light

            return (
                <div
                    className="callout flex items-start gap-3 p-4 rounded-lg border my-2"
                    style={{
                        backgroundColor: bgColor,
                        borderColor: calloutType.color,
                    }}
                    data-callout-type={props.block.props.type}
                >
                    {/* Icon with dropdown to change callout type */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div
                                className="callout-icon-wrapper flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
                                contentEditable={false}
                            >
                                <Icon
                                    className="h-5 w-5"
                                    style={{ color: calloutType.color }}
                                />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {calloutTypes.map((type) => {
                                const ItemIcon = type.icon
                                return (
                                    <DropdownMenuItem
                                        key={type.value}
                                        onClick={() => {
                                            props.editor.updateBlock(props.block, {
                                                type: 'callout',
                                                props: { type: type.value },
                                            })
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <ItemIcon
                                            className="h-4 w-4"
                                            style={{ color: type.color }}
                                        />
                                        <span>{type.title}</span>
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* Editable content area */}
                    <div 
                        className="callout-content flex-grow min-w-0"
                        ref={props.contentRef}
                    />
                </div>
            )
        },
    }
)

/**
 * Slash menu item configuration for inserting a callout block.
 */
export const insertCalloutItem = {
    title: 'Callout',
    subtext: 'Insert a callout to highlight important information',
    aliases: ['callout', 'alert', 'note', 'warning', 'info', 'success', 'error'],
    group: 'Basic blocks',
}
