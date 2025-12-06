/**
 * useAutoSave Hook
 * 
 * Custom hook for implementing debounced auto-save functionality.
 * Triggers save after specified delay of user inactivity.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export interface UseAutoSaveOptions<T> {
    /**
     * The data to auto-save.
     */
    data: T

    /**
     * Callback to perform the save operation.
     * Should return a promise that resolves when save is complete.
     */
    onSave: (data: T) => Promise<void>

    /**
     * Delay in milliseconds before triggering save after last change.
     * @default 1000
     */
    debounceMs?: number

    /**
     * Whether auto-save is enabled.
     * @default true
     */
    enabled?: boolean

    /**
     * Callback for errors during save.
     */
    onError?: (error: Error) => void
}

export interface UseAutoSaveResult {
    /**
     * Current save status.
     */
    status: SaveStatus

    /**
     * Whether there are unsaved changes.
     */
    isDirty: boolean

    /**
     * Manually trigger a save operation.
     */
    saveNow: () => Promise<void>

    /**
     * Last saved timestamp.
     */
    lastSavedAt: Date | null
}

export function useAutoSave<T>({
    data,
    onSave,
    debounceMs = 1000,
    enabled = true,
    onError
}: UseAutoSaveOptions<T>): UseAutoSaveResult {
    const [status, setStatus] = useState<SaveStatus>('idle')
    const [isDirty, setIsDirty] = useState(false)
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
    
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastDataRef = useRef<T>(data)
    const isSavingRef = useRef(false)

    // Track if data has changed
    const dataString = JSON.stringify(data)
    const lastDataString = useRef(dataString)

    // Perform the save operation
    const performSave = useCallback(async (dataToSave: T) => {
        if (isSavingRef.current) return

        isSavingRef.current = true
        setStatus('saving')

        try {
            await onSave(dataToSave)
            setStatus('saved')
            setIsDirty(false)
            setLastSavedAt(new Date())
            lastDataRef.current = dataToSave
            lastDataString.current = JSON.stringify(dataToSave)

            // Reset to idle after a brief display of "saved"
            setTimeout(() => {
                setStatus(prev => prev === 'saved' ? 'idle' : prev)
            }, 2000)
        } catch (error) {
            setStatus('error')
            onError?.(error instanceof Error ? error : new Error(String(error)))
        } finally {
            isSavingRef.current = false
        }
    }, [onSave, onError])

    // Manual save function
    const saveNow = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        await performSave(data)
    }, [data, performSave])

    // Debounced auto-save effect
    useEffect(() => {
        if (!enabled) return

        // Check if data has actually changed
        if (dataString === lastDataString.current) {
            return
        }

        setIsDirty(true)
        setStatus('pending')

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Set new timeout for debounced save
        timeoutRef.current = setTimeout(() => {
            performSave(data)
        }, debounceMs)

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [dataString, debounceMs, enabled, data, performSave])

    // Save before page unload if dirty
    useEffect(() => {
        const handleBeforeUnload = (e: Event) => {
            if (isDirty) {
                e.preventDefault()
                // Trigger immediate save
                performSave(data)
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [isDirty, data, performSave])

    return {
        status,
        isDirty,
        saveNow,
        lastSavedAt
    }
}
