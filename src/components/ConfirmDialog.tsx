/**
 * ConfirmDialog Component
 * 
 * A simple modal dialog for confirming destructive actions.
 */

import { useEffect, useRef } from 'react'

export interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'warning' | 'default'
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null)

    // Close on escape key
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onCancel])

    // Focus trap
    useEffect(() => {
        if (isOpen && dialogRef.current) {
            dialogRef.current.focus()
        }
    }, [isOpen])

    if (!isOpen) return null

    const confirmButtonClass = variant === 'danger'
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : variant === 'warning'
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
            : 'bg-potion-600 hover:bg-potion-700 text-white'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
                tabIndex={-1}
                className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 outline-none"
            >
                <h2
                    id="dialog-title"
                    className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                >
                    {title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmButtonClass}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
