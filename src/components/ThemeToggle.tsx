/**
 * Theme Toggle Component
 * 
 * Button to toggle between light, dark, and system themes.
 */

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
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )
            case 'dark':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )
            case 'system':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                )
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
