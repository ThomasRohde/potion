/**
 * Import Dialog Component
 * 
 * Shows import confirmation with preview of what will be imported.
 * Supports both replace and merge modes with conflict resolution.
 * Uses ShadCN Dialog with Radix for accessibility.
 */

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { validateExportFile } from '../services'
import type { WorkspaceExport } from '../types'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export type ImportMode = 'replace' | 'merge'

interface ImportDialogProps {
    isOpen: boolean
    file: File | null
    data?: WorkspaceExport | null
    onConfirm: (mode: ImportMode) => void
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

export function ImportDialog({ isOpen, file, data, onConfirm, onCancel }: ImportDialogProps) {
    const [validation, setValidation] = useState<ValidationResult | null>(null)
    const [isValidating, setIsValidating] = useState(false)
    const [importMode, setImportMode] = useState<ImportMode>('replace')

    // Validate the file or data when dialog opens
    useEffect(() => {
        async function validate() {
            if (!isOpen) {
                setValidation(null)
                setImportMode('replace') // Reset to default
                return
            }

            // If data is provided directly (from zustand store), use it
            if (data) {
                setValidation({
                    valid: true,
                    version: data.version,
                    pageCount: data.pages?.length || 0,
                    workspaceName: data.workspace?.name || null,
                    exportedAt: data.exportedAt || null,
                    errors: []
                })
                return
            }

            // Otherwise validate from file
            if (!file) {
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
    }, [isOpen, file, data])

    const formatDate = (isoString: string | null) => {
        if (!isoString) return 'Unknown'
        try {
            return new Date(isoString).toLocaleString()
        } catch {
            return isoString
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Workspace</DialogTitle>
                </DialogHeader>

                {isValidating ? (
                    <div className="flex items-center gap-3 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-potion-600"></div>
                        <span className="text-gray-600 dark:text-gray-400">Validating file...</span>
                    </div>
                ) : validation ? (
                    <>
                        {validation.valid ? (
                            <div className="space-y-4">
                                {/* File Info */}
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

                                {/* Import Mode Selection */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Import mode
                                    </label>
                                    <div className="space-y-2">
                                        <label
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${importMode === 'replace'
                                                ? 'border-potion-500 bg-potion-50 dark:bg-potion-900/20'
                                                : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="importMode"
                                                value="replace"
                                                checked={importMode === 'replace'}
                                                onChange={() => setImportMode('replace')}
                                                className="mt-0.5 text-potion-600 focus:ring-potion-500"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    Replace
                                                </span>
                                                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Delete all existing data and import fresh. Best for restoring from backup.
                                                </span>
                                            </div>
                                        </label>

                                        <label
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${importMode === 'merge'
                                                ? 'border-potion-500 bg-potion-50 dark:bg-potion-900/20'
                                                : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="importMode"
                                                value="merge"
                                                checked={importMode === 'merge'}
                                                onChange={() => setImportMode('merge')}
                                                className="mt-0.5 text-potion-600 focus:ring-potion-500"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    Merge
                                                </span>
                                                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Add new pages, keep existing ones. Conflicts resolved by keeping the newer version.
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Warning based on mode */}
                                {importMode === 'replace' ? (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            <strong>Warning:</strong> This will replace all existing data in your workspace. This action cannot be undone.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            <strong>Note:</strong> New pages will be added. If a page exists in both, the more recently updated version will be kept.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
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
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onConfirm(importMode)}
                        disabled={!validation?.valid || isValidating}
                    >
                        {importMode === 'replace' ? 'Import & Replace' : 'Import & Merge'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Import Result Dialog Component
 * 
 * Shows the results of an import operation, including any conflicts.
 * Uses ShadCN Dialog with Radix for accessibility.
 */
export interface ImportResultData {
    success: boolean
    pagesAdded: number
    pagesUpdated: number
    conflicts: Array<{
        type: 'page' | 'row'
        id: string
        localTitle: string
        importedTitle: string
        localUpdatedAt: string
        importedUpdatedAt: string
    }>
    errors: string[]
}

interface ImportResultDialogProps {
    isOpen: boolean
    result: ImportResultData | null
    onClose: () => void
}

export function ImportResultDialog({ isOpen, result, onClose }: ImportResultDialogProps) {
    if (!result) return null

    const formatDate = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleString()
        } catch {
            return isoString
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import {result.success ? 'Complete' : 'Failed'}</DialogTitle>
                </DialogHeader>

                {result.success ? (
                    <div className="space-y-4 flex-1 overflow-y-auto">
                        {/* Success summary */}
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="font-medium text-green-800 dark:text-green-200">
                                    Import successful!
                                </span>
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                <p>Pages added: {result.pagesAdded}</p>
                                <p>Pages updated: {result.pagesUpdated}</p>
                            </div>
                        </div>

                        {/* Conflicts resolved */}
                        {result.conflicts.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Conflicts resolved ({result.conflicts.length})
                                </h3>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {result.conflicts.map((conflict, i) => (
                                        <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {conflict.importedTitle || conflict.localTitle}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Local: {formatDate(conflict.localUpdatedAt)} •
                                                Imported: {formatDate(conflict.importedUpdatedAt)}
                                            </p>
                                            <p className="text-xs text-potion-600 dark:text-potion-400 mt-1">
                                                → Kept {new Date(conflict.importedUpdatedAt) > new Date(conflict.localUpdatedAt) ? 'imported' : 'local'} version
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                            Import failed
                        </p>
                        <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                            {result.errors.map((error, i) => (
                                <li key={i}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Actions */}
                <DialogFooter>
                    <Button
                        onClick={onClose}
                        className="w-full"
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
