/**
 * Keyboard Shortcuts Dialog
 * 
 * Displays a help dialog with all available keyboard shortcuts.
 */

import React from 'react'
import { X } from 'lucide-react'

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
    if (!isOpen) return null

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose()
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
        >
            <div className="w-full max-w-lg max-h-[80vh] overflow-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Use <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Cmd</kbd> instead of <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl</kbd> on macOS.
                    </p>

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
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                        Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd> to close
                    </p>
                </div>
            </div>
        </div>
    )
}
