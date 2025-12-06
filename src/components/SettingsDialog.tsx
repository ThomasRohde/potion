/**
 * Settings Dialog Component
 * 
 * User preferences panel for theme, editor settings, and workspace configuration.
 * Theme state managed by ThemeStore (zustand).
 */

import { useState, useEffect, useCallback } from 'react'
import type { Settings, ThemePreference } from '../types'
import { getStorage } from '../storage'
import { useThemeStore } from '../stores'

interface SettingsDialogProps {
    isOpen: boolean
    workspaceName: string
    onClose: () => void
    onWorkspaceNameChange: (name: string) => void
}

const DEFAULT_SETTINGS_ID = 'default'

export function SettingsDialog({
    isOpen,
    workspaceName,
    onClose,
    onWorkspaceNameChange
}: SettingsDialogProps) {
    // Theme from zustand store
    const themePreference = useThemeStore(state => state.preference)
    const setTheme = useThemeStore(state => state.setTheme)

    const [settings, setSettings] = useState<Settings>({
        id: DEFAULT_SETTINGS_ID,
        theme: 'system',
        fontSize: 16,
        editorWidth: 'medium',
        sidebarCollapsed: false
    })
    const [editedWorkspaceName, setEditedWorkspaceName] = useState(workspaceName)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Load settings on open
    useEffect(() => {
        async function loadSettings() {
            if (!isOpen) return

            setIsLoading(true)
            try {
                const storage = await getStorage()
                const stored = await storage.getSettings(DEFAULT_SETTINGS_ID)
                if (stored) {
                    setSettings(stored)
                }
                setEditedWorkspaceName(workspaceName)
            } catch (error) {
                console.error('Failed to load settings:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadSettings()
    }, [isOpen, workspaceName])

    // Handle escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return
        if (e.key === 'Escape') {
            onClose()
        }
    }, [isOpen, onClose])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // Save settings
    const saveSettings = useCallback(async (newSettings: Partial<Settings>) => {
        setIsSaving(true)
        try {
            const storage = await getStorage()
            const updated: Settings = { ...settings, ...newSettings }
            await storage.upsertSettings(updated)
            setSettings(updated)

            // Apply theme immediately via ThemeStore
            if (newSettings.theme) {
                setTheme(newSettings.theme)
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
        } finally {
            setIsSaving(false)
        }
    }, [settings, setTheme])

    // Handle workspace name change
    const handleWorkspaceNameSave = () => {
        if (editedWorkspaceName.trim() && editedWorkspaceName !== workspaceName) {
            onWorkspaceNameChange(editedWorkspaceName.trim())
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-potion-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Workspace Section */}
                            <section>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Workspace
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Workspace name
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editedWorkspaceName}
                                                onChange={(e) => setEditedWorkspaceName(e.target.value)}
                                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-potion-500"
                                            />
                                            <button
                                                onClick={handleWorkspaceNameSave}
                                                disabled={!editedWorkspaceName.trim() || editedWorkspaceName === workspaceName}
                                                className="px-3 py-2 text-sm font-medium bg-potion-600 text-white rounded-lg hover:bg-potion-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Appearance Section */}
                            <section>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Appearance
                                </h3>
                                <div className="space-y-4">
                                    {/* Theme */}
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            Theme
                                        </label>
                                        <div className="flex gap-2">
                                            {(['light', 'dark', 'system'] as ThemePreference[]).map((themeOption) => (
                                                <button
                                                    key={themeOption}
                                                    onClick={() => saveSettings({ theme: themeOption })}
                                                    disabled={isSaving}
                                                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${themePreference === themeOption
                                                            ? 'border-potion-500 bg-potion-50 dark:bg-potion-900/30 text-potion-700 dark:text-potion-300'
                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    {themeOption === 'light' && '☀️ '}
                                                    {themeOption === 'dark' && '🌙 '}
                                                    {themeOption === 'system' && '💻 '}
                                                    {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Editor Section */}
                            <section>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Editor
                                </h3>
                                <div className="space-y-4">
                                    {/* Font Size */}
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            Font size
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="12"
                                                max="24"
                                                value={settings.fontSize}
                                                onChange={(e) => saveSettings({ fontSize: parseInt(e.target.value) })}
                                                className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-potion-600"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                                                {settings.fontSize}px
                                            </span>
                                        </div>
                                    </div>

                                    {/* Editor Width */}
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            Editor width
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(['narrow', 'medium', 'wide', 'full'] as const).map((width) => (
                                                <button
                                                    key={width}
                                                    onClick={() => saveSettings({ editorWidth: width })}
                                                    disabled={isSaving}
                                                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${settings.editorWidth === width
                                                            ? 'border-potion-500 bg-potion-50 dark:bg-potion-900/30 text-potion-700 dark:text-potion-300'
                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    {width.charAt(0).toUpperCase() + width.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {settings.editorWidth === 'narrow' && 'Comfortable for focused reading (640px)'}
                                            {settings.editorWidth === 'medium' && 'Balanced for most content (768px)'}
                                            {settings.editorWidth === 'wide' && 'More space for tables and images (1024px)'}
                                            {settings.editorWidth === 'full' && 'Use full available width'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* About Section */}
                            <section>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    About
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                                    <p className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">🧪</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">Potion</span>
                                    </p>
                                    <p className="mb-2">
                                        A privacy-first, local-only workspace for notes and documents.
                                        All your data stays on your device.
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        Version 0.1.0 • Made with ❤️
                                    </p>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    )
}
