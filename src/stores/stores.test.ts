/**
 * Unit tests for Zustand stores
 * 
 * Tests WorkspaceStore, UIStore, and ThemeStore
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { useWorkspaceStore, selectCurrentPage, selectFavoritePages } from './workspaceStore';
import { useUIStore } from './uiStore';
import { useThemeStore, selectThemePreference, selectIsDarkMode } from './themeStore';
import type { PageSummary } from '../types';

// Helper to reset stores between tests
const resetStores = () => {
    useWorkspaceStore.setState(useWorkspaceStore.getInitialState());
    useUIStore.setState(useUIStore.getInitialState());
    useThemeStore.setState({ preference: 'system', applied: 'light' });
};

describe('WorkspaceStore', () => {
    beforeEach(resetStores);
    
    it('should initialize with default state', () => {
        const state = useWorkspaceStore.getState();
        expect(state.workspaceId).toBeNull();
        expect(state.workspaceName).toBe('My Workspace');
        expect(state.pages).toEqual([]);
        expect(state.pageTree).toEqual([]);
        expect(state.currentPageId).toBeNull();
        expect(state.isLoading).toBe(true);
    });
    
    it('should set workspace', () => {
        useWorkspaceStore.getState().setWorkspace('ws-1', 'Test Workspace');
        const state = useWorkspaceStore.getState();
        expect(state.workspaceId).toBe('ws-1');
        expect(state.workspaceName).toBe('Test Workspace');
    });
    
    it('should set workspace name', () => {
        useWorkspaceStore.getState().setWorkspaceName('New Name');
        expect(useWorkspaceStore.getState().workspaceName).toBe('New Name');
    });
    
    it('should set pages and build tree', () => {
        const pages: PageSummary[] = [
            { id: 'p1', workspaceId: 'ws-1', parentPageId: null, title: 'Page 1', type: 'page', isFavorite: false, createdAt: '', updatedAt: '' },
            { id: 'p2', workspaceId: 'ws-1', parentPageId: 'p1', title: 'Child Page', type: 'page', isFavorite: false, createdAt: '', updatedAt: '' },
        ];
        
        useWorkspaceStore.getState().setPages(pages);
        const state = useWorkspaceStore.getState();
        
        expect(state.pages).toHaveLength(2);
        expect(state.pageTree).toHaveLength(1);
        expect(state.pageTree[0].children).toHaveLength(1);
        expect(state.isLoading).toBe(false);
    });
    
    it('should set current page ID', () => {
        useWorkspaceStore.getState().setCurrentPageId('p1');
        expect(useWorkspaceStore.getState().currentPageId).toBe('p1');
    });
    
    it('should add a page', () => {
        const page: PageSummary = { id: 'p1', workspaceId: 'ws-1', parentPageId: null, title: 'New Page', type: 'page', isFavorite: false, createdAt: '', updatedAt: '' };
        useWorkspaceStore.getState().addPage(page);
        expect(useWorkspaceStore.getState().pages).toHaveLength(1);
    });
    
    it('should update a page', () => {
        const page: PageSummary = { id: 'p1', workspaceId: 'ws-1', parentPageId: null, title: 'Original', type: 'page', isFavorite: false, createdAt: '', updatedAt: '' };
        useWorkspaceStore.getState().setPages([page]);
        useWorkspaceStore.getState().updatePage('p1', { title: 'Updated' });
        expect(useWorkspaceStore.getState().pages[0].title).toBe('Updated');
    });
    
    it('should remove a page', () => {
        const pages: PageSummary[] = [
            { id: 'p1', workspaceId: 'ws-1', parentPageId: null, title: 'Page 1', type: 'page', isFavorite: false, createdAt: '', updatedAt: '' },
            { id: 'p2', workspaceId: 'ws-1', parentPageId: null, title: 'Page 2', type: 'page', isFavorite: false, createdAt: '', updatedAt: '' },
        ];
        useWorkspaceStore.getState().setPages(pages);
        useWorkspaceStore.getState().removePage('p1');
        expect(useWorkspaceStore.getState().pages).toHaveLength(1);
        expect(useWorkspaceStore.getState().pages[0].id).toBe('p2');
    });
    
    it('should clear currentPageId when removed page is current', () => {
        useWorkspaceStore.getState().setPages([
            { id: 'p1', workspaceId: 'ws-1', parentPageId: null, title: 'Page', type: 'page', isFavorite: false, createdAt: '', updatedAt: '' },
        ]);
        useWorkspaceStore.getState().setCurrentPageId('p1');
        useWorkspaceStore.getState().removePage('p1');
        expect(useWorkspaceStore.getState().currentPageId).toBeNull();
    });
    
    it('selectCurrentPage should return current page', () => {
        const page: PageSummary = { id: 'p1', workspaceId: 'ws-1', parentPageId: null, title: 'Page', type: 'page', isFavorite: false, createdAt: '', updatedAt: '' };
        useWorkspaceStore.getState().setPages([page]);
        useWorkspaceStore.getState().setCurrentPageId('p1');
        expect(selectCurrentPage(useWorkspaceStore.getState())).toEqual(page);
    });
    
    it('selectFavoritePages should return favorite pages', () => {
        const pages: PageSummary[] = [
            { id: 'p1', workspaceId: 'ws-1', parentPageId: null, title: 'Page 1', type: 'page', isFavorite: true, createdAt: '', updatedAt: '' },
            { id: 'p2', workspaceId: 'ws-1', parentPageId: null, title: 'Page 2', type: 'page', isFavorite: false, createdAt: '', updatedAt: '' },
        ];
        useWorkspaceStore.getState().setPages(pages);
        expect(selectFavoritePages(useWorkspaceStore.getState())).toHaveLength(1);
    });
});

describe('UIStore', () => {
    beforeEach(resetStores);
    
    it('should initialize with default state', () => {
        const state = useUIStore.getState();
        expect(state.sidebarCollapsed).toBe(false);
        expect(state.sidebarWidth).toBe(280);
        expect(state.isSearchOpen).toBe(false);
        expect(state.isShortcutsOpen).toBe(false);
        expect(state.isSettingsOpen).toBe(false);
    });
    
    it('should toggle sidebar', () => {
        useUIStore.getState().toggleSidebar();
        expect(useUIStore.getState().sidebarCollapsed).toBe(true);
        useUIStore.getState().toggleSidebar();
        expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
    
    it('should set sidebar width', () => {
        useUIStore.getState().setSidebarWidth(350);
        expect(useUIStore.getState().sidebarWidth).toBe(350);
    });
    
    it('should open and close search', () => {
        useUIStore.getState().openSearch();
        expect(useUIStore.getState().isSearchOpen).toBe(true);
        useUIStore.getState().closeSearch();
        expect(useUIStore.getState().isSearchOpen).toBe(false);
    });
    
    it('should toggle search', () => {
        useUIStore.getState().toggleSearch();
        expect(useUIStore.getState().isSearchOpen).toBe(true);
        useUIStore.getState().toggleSearch();
        expect(useUIStore.getState().isSearchOpen).toBe(false);
    });
    
    it('should open and close shortcuts dialog', () => {
        useUIStore.getState().openShortcuts();
        expect(useUIStore.getState().isShortcutsOpen).toBe(true);
        useUIStore.getState().closeShortcuts();
        expect(useUIStore.getState().isShortcutsOpen).toBe(false);
    });
    
    it('should open and close settings dialog', () => {
        useUIStore.getState().openSettings();
        expect(useUIStore.getState().isSettingsOpen).toBe(true);
        useUIStore.getState().closeSettings();
        expect(useUIStore.getState().isSettingsOpen).toBe(false);
    });
    
    it('should open and close delete confirmation', () => {
        useUIStore.getState().openDeleteConfirm('p1', 'Test Page');
        const state = useUIStore.getState();
        expect(state.deleteConfirm.isOpen).toBe(true);
        expect(state.deleteConfirm.pageId).toBe('p1');
        expect(state.deleteConfirm.pageTitle).toBe('Test Page');
        
        useUIStore.getState().closeDeleteConfirm();
        expect(useUIStore.getState().deleteConfirm.isOpen).toBe(false);
    });
    
    it('should open import with data', () => {
        const mockData = { version: 1, exportedAt: '', workspace: {} as never, pages: [], databases: [], rows: [], settings: null };
        useUIStore.getState().openImport(mockData);
        expect(useUIStore.getState().importState.isOpen).toBe(true);
        expect(useUIStore.getState().importState.data).toEqual(mockData);
    });
    
    it('should set import mode', () => {
        useUIStore.getState().setImportMode('merge');
        expect(useUIStore.getState().importState.mode).toBe('merge');
    });
});

describe('ThemeStore', () => {
    beforeEach(resetStores);
    
    it('should initialize with system preference', () => {
        const state = useThemeStore.getState();
        expect(state.preference).toBe('system');
        expect(['light', 'dark']).toContain(state.applied);
    });
    
    it('should set theme preference', () => {
        useThemeStore.getState().setTheme('dark');
        expect(useThemeStore.getState().preference).toBe('dark');
        expect(useThemeStore.getState().applied).toBe('dark');
    });
    
    it('should toggle theme in cycle', () => {
        useThemeStore.getState().setTheme('light');
        
        useThemeStore.getState().toggleTheme();
        expect(useThemeStore.getState().preference).toBe('dark');
        
        useThemeStore.getState().toggleTheme();
        expect(useThemeStore.getState().preference).toBe('system');
        
        useThemeStore.getState().toggleTheme();
        expect(useThemeStore.getState().preference).toBe('light');
    });
    
    it('selectThemePreference should return preference', () => {
        useThemeStore.getState().setTheme('dark');
        expect(selectThemePreference(useThemeStore.getState())).toBe('dark');
    });
    
    it('selectIsDarkMode should return true when dark', () => {
        useThemeStore.getState().setTheme('dark');
        expect(selectIsDarkMode(useThemeStore.getState())).toBe(true);
        
        useThemeStore.getState().setTheme('light');
        expect(selectIsDarkMode(useThemeStore.getState())).toBe(false);
    });
});
