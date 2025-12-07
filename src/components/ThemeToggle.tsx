/**
 * Theme Toggle Component
 * 
 * Button to toggle between light, dark, and system themes.
 */

import { Sun, Moon, Monitor } from 'lucide-react'
import type { ThemePreference } from '../types'
import { Button } from '@/components/ui/button'

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
        <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            data-testid={testId}
            className={className}
            title={`${getLabel()} - Click to change`}
            aria-label={`Current theme: ${getLabel()}`}
        >
            {getIcon()}
        </Button>
    )
}
