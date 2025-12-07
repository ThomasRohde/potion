/**
 * SaveStatusIndicator Component
 * 
 * Visual indicator showing the current save status.
 * Displays as a subtle badge in the topbar or content area.
 */

import React from 'react'
import { Circle, Loader2, Check, AlertTriangle } from 'lucide-react'
import type { SaveStatus } from '../hooks/useAutoSave'

export interface SaveStatusIndicatorProps {
    status: SaveStatus
    className?: string
}

export function SaveStatusIndicator({ status, className = '' }: SaveStatusIndicatorProps) {
    if (status === 'idle') {
        return null
    }

    const statusConfig: Record<SaveStatus, { label: string; icon: React.ReactNode; color: string }> = {
        idle: { label: '', icon: null, color: '' },
        pending: {
            label: 'Unsaved changes',
            icon: <Circle className="w-3 h-3" fill="currentColor" />,
            color: 'text-yellow-600 dark:text-yellow-400'
        },
        saving: {
            label: 'Saving...',
            icon: <Loader2 className="w-3 h-3 animate-spin" />,
            color: 'text-potion-600 dark:text-potion-400'
        },
        saved: {
            label: 'Saved',
            icon: <Check className="w-3 h-3" />,
            color: 'text-green-600 dark:text-green-400'
        },
        error: {
            label: 'Save failed',
            icon: <AlertTriangle className="w-3 h-3" />,
            color: 'text-red-600 dark:text-red-400'
        }
    }

    const config = statusConfig[status]

    return (
        <div
            className={`inline-flex items-center gap-1.5 text-xs ${config.color} ${className}`}
            title={config.label}
        >
            {config.icon}
            <span>{config.label}</span>
        </div>
    )
}
