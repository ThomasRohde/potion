/**
 * ThemeStore - Zustand store for theme state
 * 
 * Manages:
 * - Theme preference (light/dark/system)
 * - System theme detection via matchMedia
 * - Applied theme (resolved from preference)
 * 
 * Uses persist middleware for localStorage persistence.
 * Applies theme to document.documentElement on change.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ThemePreference } from '../types';

export type AppliedTheme = 'light' | 'dark';

export interface ThemeState {
    preference: ThemePreference;
    applied: AppliedTheme;
}

export interface ThemeActions {
    setTheme: (preference: ThemePreference) => void;
    toggleTheme: () => void;
    syncSystemTheme: () => void;
}

/**
 * Get the system theme preference from matchMedia
 */
function getSystemTheme(): AppliedTheme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve the applied theme from the preference
 */
function resolveTheme(preference: ThemePreference): AppliedTheme {
    if (preference === 'system') {
        return getSystemTheme();
    }
    return preference;
}

/**
 * Apply theme to document
 */
function applyThemeToDocument(theme: AppliedTheme): void {
    if (typeof document === 'undefined') return;
    
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

const initialPreference: ThemePreference = 'system';
const initialApplied = resolveTheme(initialPreference);

export const useThemeStore = create<ThemeState & ThemeActions>()(
    devtools(
        persist(
            (set, get) => ({
                preference: initialPreference,
                applied: initialApplied,
                
                setTheme: (preference) => {
                    const applied = resolveTheme(preference);
                    applyThemeToDocument(applied);
                    set({ preference, applied }, false, 'theme/setTheme');
                },
                
                toggleTheme: () => {
                    const { preference } = get();
                    // Cycle: light -> dark -> system -> light
                    const nextPreference: ThemePreference = 
                        preference === 'light' ? 'dark' :
                        preference === 'dark' ? 'system' : 'light';
                    
                    const applied = resolveTheme(nextPreference);
                    applyThemeToDocument(applied);
                    set({ preference: nextPreference, applied }, false, 'theme/toggleTheme');
                },
                
                syncSystemTheme: () => {
                    const { preference } = get();
                    if (preference === 'system') {
                        const applied = getSystemTheme();
                        applyThemeToDocument(applied);
                        set({ applied }, false, 'theme/syncSystemTheme');
                    }
                },
            }),
            {
                name: 'potion-theme',
                partialize: (state) => ({ preference: state.preference }),
                onRehydrateStorage: () => (state) => {
                    // Apply theme after hydration
                    if (state) {
                        const applied = resolveTheme(state.preference);
                        applyThemeToDocument(applied);
                        state.applied = applied;
                    }
                },
            }
        ),
        { name: 'ThemeStore', enabled: import.meta.env.DEV }
    )
);

// Initialize system theme listener
if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Listen for system theme changes
    const handleChange = () => {
        useThemeStore.getState().syncSystemTheme();
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
    } else {
        // Legacy Safari
        mediaQuery.addListener(handleChange);
    }
    
    // Apply theme on initial load
    const state = useThemeStore.getState();
    applyThemeToDocument(resolveTheme(state.preference));
}

// Selectors
export const selectThemePreference = (state: ThemeState) => state.preference;
export const selectAppliedTheme = (state: ThemeState) => state.applied;
export const selectIsDarkMode = (state: ThemeState) => state.applied === 'dark';
