/**
 * Zustand Store Exports
 * 
 * This module exports all zustand stores for the Potion application.
 * Stores use immer middleware for immutable updates with mutable syntax.
 * 
 * Architecture:
 * - WorkspaceStore: Workspace data, pages, current page selection
 * - UIStore: Dialog visibility, sidebar state, modals
 * - ThemeStore: Light/dark/system theme with localStorage persistence
 */

export { useWorkspaceStore } from './workspaceStore';
export { useUIStore } from './uiStore';
export { useThemeStore } from './themeStore';
