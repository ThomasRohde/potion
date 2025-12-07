/**
 * Keyboard Shortcuts Dialog
 * 
 * Displays a help dialog with all available keyboard shortcuts.
 * Uses ShadCN Dialog with Radix for accessibility.
 */

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardShortcutsDialogProps {
    isOpen: boolean
    onClose: () => void
}

interface ShortcutGroup {
    title: string
    shortcuts: Array<{
        keys: string[]
        description: string
    }>
}

const shortcutGroups: ShortcutGroup[] = [
    {
        title: 'Navigation',
        shortcuts: [
            { keys: ['Ctrl', 'K'], description: 'Open search' },
            { keys: ['?'], description: 'Show keyboard shortcuts' },
            { keys: ['Esc'], description: 'Close dialog / Cancel' }
        ]
    },
    {
        title: 'Pages',
        shortcuts: [
            { keys: ['Ctrl', 'N'], description: 'Create new page' }
        ]
    },
    {
        title: 'Text Formatting',
        shortcuts: [
            { keys: ['Ctrl', 'B'], description: 'Bold' },
            { keys: ['Ctrl', 'I'], description: 'Italic' },
            { keys: ['Ctrl', 'U'], description: 'Underline' },
            { keys: ['Ctrl', 'Shift', 'S'], description: 'Strikethrough' },
            { keys: ['Ctrl', 'E'], description: 'Inline code' },
            { keys: ['Ctrl', 'K'], description: 'Add link' }
        ]
    },
    {
        title: 'Blocks',
        shortcuts: [
            { keys: ['/'], description: 'Open slash command menu' },
            { keys: ['Enter'], description: 'Create new block' },
            { keys: ['Backspace'], description: 'Delete empty block / Merge with previous' },
            { keys: ['Tab'], description: 'Indent block (in lists)' },
            { keys: ['Shift', 'Tab'], description: 'Unindent block' },
            { keys: ['↑', '↓'], description: 'Navigate between blocks' }
        ]
    }
]

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Keyboard Shortcuts</DialogTitle>
                    <DialogDescription>
                        Use <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Cmd</kbd> instead of <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl</kbd> on macOS.
                    </DialogDescription>
                </DialogHeader>

                {/* Content */}
                <div className="space-y-6">
                    {shortcutGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {group.title}
                            </h3>
                            <div className="space-y-2">
                                {group.shortcuts.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {shortcut.description}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <React.Fragment key={keyIndex}>
                                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                                                        {key}
                                                    </kbd>
                                                    {keyIndex < shortcut.keys.length - 1 && (
                                                        <span className="text-gray-400 text-xs">+</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                        Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd> to close
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
