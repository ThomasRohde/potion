/**
 * Import Dialog Component
 * 
 * Shows import confirmation with preview of what will be imported.
 */

import { useState, useEffect, useCallback } from 'react'
import { validateExportFile } from '../services'

interface ImportDialogProps {
    isOpen: boolean
    file: File | null
    onConfirm: () => void
    onCancel: () => void
}

interface ValidationResult {
    valid: boolean
    version: number | null
    pageCount: number
    workspaceName: string | null
    exportedAt: string | null
    errors: string[]
}

export function ImportDialog({ isOpen, file, onConfirm, onCancel }: ImportDialogProps) {
    const [validation, setValidation] = useState<ValidationResult | null>(null)
    const [isValidating, setIsValidating] = useState(false)

    // Validate the file when dialog opens
    useEffect(() => {
        async function validate() {
            if (!isOpen || !file) {
                setValidation(null)
                return
            }

            setIsValidating(true)
            try {
                const result = await validateExportFile(file)
                setValidation(result)
            } catch {
                setValidation({
                    valid: false,
                    version: null,
                    pageCount: 0,
                    workspaceName: null,
                    exportedAt: null,
                    errors: ['Failed to validate file']
                })
            } finally {
                setIsValidating(false)
            }
        }
        validate()
    }, [isOpen, file])

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return
        if (e.key === 'Escape') {
            onCancel()
        } else if (e.key === 'Enter' && validation?.valid) {
            onConfirm()
        }
    }, [isOpen, validation, onConfirm, onCancel])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    if (!isOpen) return null

    const formatDate = (isoString: string | null) => {
        if (!isoString) return 'Unknown'
        try {
            return new Date(isoString).toLocaleString()
        } catch {
            return isoString
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Import Workspace
                </h2>

                {isValidating ? (
                    <div className="flex items-center gap-3 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-potion-600"></div>
                        <span className="text-gray-600 dark:text-gray-400">Validating file...</span>
                    </div>
                ) : validation ? (
                    <>
                        {validation.valid ? (
                            <div className="space-y-3 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Workspace:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {validation.workspaceName || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Pages:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {validation.pageCount}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Exported:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {formatDate(validation.exportedAt)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Format version:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {validation.version}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        <strong>Warning:</strong> This will replace all existing data in your workspace. This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                                        Invalid file
                                    </p>
                                    <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                                        {validation.errors.map((error, i) => (
                                            <li key={i}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </>
                ) : null}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!validation?.valid || isValidating}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${validation?.valid && !isValidating
                                ? 'bg-potion-600 text-white hover:bg-potion-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Import & Replace
                    </button>
                </div>
            </div>
        </div>
    )
}
