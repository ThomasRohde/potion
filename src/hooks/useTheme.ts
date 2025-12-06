/**
 * Theme Hook
 * 
 * Manages theme state (light/dark/system) with persistence.
 */

import { useState, useEffect, useCallback } from 'react'
import { getStorage } from '../storage'
import type { Settings } from '../types'

export type Theme = 'light' | 'dark' | 'system'

const DEFAULT_SETTINGS_ID = 'default'

/**
 * Detect system color scheme preference.
 */
function getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
}

/**
 * Apply theme class to document.
 */
function applyTheme(theme: Theme) {
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme

    if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('system')
    const [isLoading, setIsLoading] = useState(true)

    // Load theme from settings on mount
    useEffect(() => {
        async function loadTheme() {
            try {
                const storage = await getStorage()
                const settings = await storage.getSettings(DEFAULT_SETTINGS_ID)
                const savedTheme = (settings?.theme as Theme) || 'system'
                setThemeState(savedTheme)
                applyTheme(savedTheme)
            } catch (error) {
                console.error('Failed to load theme:', error)
                applyTheme('system')
            } finally {
                setIsLoading(false)
            }
        }
        loadTheme()
    }, [])

    // Listen for system preference changes
    useEffect(() => {
        if (theme !== 'system') return

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const handleChange = () => {
            applyTheme('system')
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    const setTheme = useCallback(async (newTheme: Theme) => {
        setThemeState(newTheme)
        applyTheme(newTheme)

        // Persist to settings
        try {
            const storage = await getStorage()
            const settings = await storage.getSettings(DEFAULT_SETTINGS_ID)

            const updatedSettings: Settings = {
                id: DEFAULT_SETTINGS_ID,
                theme: newTheme,
                fontSize: settings?.fontSize ?? 16,
                editorWidth: settings?.editorWidth ?? 'medium',
                sidebarCollapsed: settings?.sidebarCollapsed ?? false
            }

            await storage.upsertSettings(updatedSettings)
        } catch (error) {
            console.error('Failed to save theme:', error)
        }
    }, [])

    const toggleTheme = useCallback(() => {
        // Cycle through: light -> dark -> system -> light
        const next: Record<Theme, Theme> = {
            'light': 'dark',
            'dark': 'system',
            'system': 'light'
        }
        setTheme(next[theme])
    }, [theme, setTheme])

    return {
        theme,
        setTheme,
        toggleTheme,
        isLoading,
        effectiveTheme: theme === 'system' ? getSystemTheme() : theme
    }
}
