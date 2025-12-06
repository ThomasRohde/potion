/**
 * UIStore - Zustand store for UI state
 * 
 * Manages:
 * - Sidebar collapsed/expanded state and width
 * - Dialog visibility (search, shortcuts, settings, import, confirm)
 * - Delete confirmation state
 * - Import dialog state
 * 
 * Uses immer middleware for immutable updates with mutable syntax.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';
import type { WorkspaceExport } from '../types';

export interface DeleteConfirmState {
    isOpen: boolean;
    pageId: string | null;
    pageTitle: string;
}

export interface ImportState {
    isOpen: boolean;
    data: WorkspaceExport | null;
    mode: 'replace' | 'merge';
    error: string | null;
}

export interface UIState {
    // Sidebar
    sidebarCollapsed: boolean;
    sidebarWidth: number;

    // Dialogs
    isSearchOpen: boolean;
    isShortcutsOpen: boolean;
    isSettingsOpen: boolean;

    // Delete confirmation
    deleteConfirm: DeleteConfirmState;

    // Import dialog
    importState: ImportState;
}

export interface UIActions {
    // Sidebar actions
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setSidebarWidth: (width: number) => void;

    // Dialog actions
    openSearch: () => void;
    closeSearch: () => void;
    toggleSearch: () => void;

    openShortcuts: () => void;
    closeShortcuts: () => void;

    openSettings: () => void;
    closeSettings: () => void;

    // Delete confirmation actions
    openDeleteConfirm: (pageId: string, pageTitle: string) => void;
    closeDeleteConfirm: () => void;

    // Import actions
    openImport: (data: WorkspaceExport) => void;
    closeImport: () => void;
    setImportMode: (mode: 'replace' | 'merge') => void;
    setImportError: (error: string | null) => void;

    // Reset
    reset: () => void;
}

const initialDeleteConfirm: DeleteConfirmState = {
    isOpen: false,
    pageId: null,
    pageTitle: '',
};

const initialImportState: ImportState = {
    isOpen: false,
    data: null,
    mode: 'replace',
    error: null,
};

const initialState: UIState = {
    sidebarCollapsed: false,
    sidebarWidth: 280,
    isSearchOpen: false,
    isShortcutsOpen: false,
    isSettingsOpen: false,
    deleteConfirm: initialDeleteConfirm,
    importState: initialImportState,
};

export const useUIStore = create<UIState & UIActions>()(
    devtools(
        persist(
            immer((set) => ({
                ...initialState,

                // Sidebar actions
                toggleSidebar: () => set((state) => {
                    state.sidebarCollapsed = !state.sidebarCollapsed;
                }, false, 'ui/toggleSidebar'),

                setSidebarCollapsed: (collapsed) => set((state) => {
                    state.sidebarCollapsed = collapsed;
                }, false, 'ui/setSidebarCollapsed'),

                setSidebarWidth: (width) => set((state) => {
                    state.sidebarWidth = width;
                }, false, 'ui/setSidebarWidth'),

                // Search dialog
                openSearch: () => set((state) => {
                    state.isSearchOpen = true;
                }, false, 'ui/openSearch'),

                closeSearch: () => set((state) => {
                    state.isSearchOpen = false;
                }, false, 'ui/closeSearch'),

                toggleSearch: () => set((state) => {
                    state.isSearchOpen = !state.isSearchOpen;
                }, false, 'ui/toggleSearch'),

                // Shortcuts dialog
                openShortcuts: () => set((state) => {
                    state.isShortcutsOpen = true;
                }, false, 'ui/openShortcuts'),

                closeShortcuts: () => set((state) => {
                    state.isShortcutsOpen = false;
                }, false, 'ui/closeShortcuts'),

                // Settings dialog
                openSettings: () => set((state) => {
                    state.isSettingsOpen = true;
                }, false, 'ui/openSettings'),

                closeSettings: () => set((state) => {
                    state.isSettingsOpen = false;
                }, false, 'ui/closeSettings'),

                // Delete confirmation
                openDeleteConfirm: (pageId, pageTitle) => set((state) => {
                    state.deleteConfirm = {
                        isOpen: true,
                        pageId,
                        pageTitle,
                    };
                }, false, 'ui/openDeleteConfirm'),

                closeDeleteConfirm: () => set((state) => {
                    state.deleteConfirm = initialDeleteConfirm;
                }, false, 'ui/closeDeleteConfirm'),

                // Import
                openImport: (data) => set((state) => {
                    state.importState = {
                        isOpen: true,
                        data,
                        mode: 'replace',
                        error: null,
                    };
                }, false, 'ui/openImport'),

                closeImport: () => set((state) => {
                    state.importState = initialImportState;
                }, false, 'ui/closeImport'),

                setImportMode: (mode) => set((state) => {
                    state.importState.mode = mode;
                }, false, 'ui/setImportMode'),

                setImportError: (error) => set((state) => {
                    state.importState.error = error;
                }, false, 'ui/setImportError'),

                // Reset
                reset: () => set(() => initialState, false, 'ui/reset'),
            })),
            {
                name: 'potion-ui-state',
                // Only persist sidebar preferences, not dialog states
                partialize: (state) => ({
                    sidebarCollapsed: state.sidebarCollapsed,
                    sidebarWidth: state.sidebarWidth,
                }),
            }
        ),
        { name: 'UIStore', enabled: import.meta.env.DEV }
    )
);
