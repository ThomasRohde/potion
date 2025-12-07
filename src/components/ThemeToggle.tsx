/**
 * Theme Toggle Component
 * 
 * Button to toggle between light, dark, and system themes.
 */

import { Sun, Moon, Monitor } from 'lucide-react'
import type { ThemePreference } from '../types'

interface ThemeToggleProps {
    theme: ThemePreference
    onToggle: () => void
    className?: string
    'data-testid'?: string
}

export function ThemeToggle({ theme, onToggle, className = '', 'data-testid': testId }: ThemeToggleProps) {
    const getIcon = () => {
        switch (theme) {
            case 'light':
                return <Sun className="w-4 h-4" />
            case 'dark':
                return <Moon className="w-4 h-4" />
            case 'system':
                return <Monitor className="w-4 h-4" />
        }
    }

    const getLabel = () => {
        switch (theme) {
            case 'light': return 'Light mode'
            case 'dark': return 'Dark mode'
            case 'system': return 'System theme'
        }
    }

    return (
        <button
            onClick={onToggle}
            data-testid={testId}
            className={`flex items-center justify-center p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors ${className}`}
            title={`${getLabel()} - Click to change`}
            aria-label={`Current theme: ${getLabel()}`}
        >
            {getIcon()}
        </button>
    )
}
