/**
 * WorkspaceStore - Zustand store for workspace and page state
 * 
 * Manages:
 * - Current workspace ID and name
 * - List of all pages (as PageSummary for performance)
 * - Currently selected page ID
 * - Page tree structure
 * 
 * Uses immer middleware for immutable updates with mutable syntax.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { PageSummary } from '../types';
import { buildPageTree, type PageTreeNode } from '../services/pageService';

export interface WorkspaceState {
    // Workspace data
    workspaceId: string | null;
    workspaceName: string;

    // Page data
    pages: PageSummary[];
    pageTree: PageTreeNode[];
    currentPageId: string | null;

    // Loading state
    isLoading: boolean;
    error: string | null;
}

export interface WorkspaceActions {
    // Workspace actions
    setWorkspace: (id: string, name: string) => void;
    setWorkspaceName: (name: string) => void;

    // Page actions
    setPages: (pages: PageSummary[]) => void;
    refreshPages: (pages: PageSummary[]) => void;
    setCurrentPageId: (pageId: string | null) => void;

    // Page mutations (optimistic updates)
    addPage: (page: PageSummary) => void;
    updatePage: (pageId: string, updates: Partial<PageSummary>) => void;
    removePage: (pageId: string) => void;

    // Loading state
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Reset
    reset: () => void;
}

const initialState: WorkspaceState = {
    workspaceId: null,
    workspaceName: 'My Workspace',
    pages: [],
    pageTree: [],
    currentPageId: null,
    isLoading: true,
    error: null,
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
    devtools(
        immer((set) => ({
            ...initialState,

            // Workspace actions
            setWorkspace: (id, name) => set((state) => {
                state.workspaceId = id;
                state.workspaceName = name;
            }, false, 'workspace/setWorkspace'),

            setWorkspaceName: (name) => set((state) => {
                state.workspaceName = name;
            }, false, 'workspace/setWorkspaceName'),

            // Page actions
            setPages: (pages) => set((state) => {
                state.pages = pages;
                state.pageTree = buildPageTree(pages);
                state.isLoading = false;
            }, false, 'pages/setPages'),

            refreshPages: (pages) => set((state) => {
                state.pages = pages;
                state.pageTree = buildPageTree(pages);
            }, false, 'pages/refreshPages'),

            setCurrentPageId: (pageId) => set((state) => {
                state.currentPageId = pageId;
            }, false, 'pages/setCurrentPageId'),

            // Page mutations
            addPage: (page) => set((state) => {
                state.pages.push(page);
                state.pageTree = buildPageTree(state.pages);
            }, false, 'pages/addPage'),

            updatePage: (pageId, updates) => set((state) => {
                const index = state.pages.findIndex(p => p.id === pageId);
                if (index !== -1) {
                    Object.assign(state.pages[index], updates);
                    state.pageTree = buildPageTree(state.pages);
                }
            }, false, 'pages/updatePage'),

            removePage: (pageId) => set((state) => {
                state.pages = state.pages.filter(p => p.id !== pageId);
                state.pageTree = buildPageTree(state.pages);
                if (state.currentPageId === pageId) {
                    state.currentPageId = null;
                }
            }, false, 'pages/removePage'),

            // Loading state
            setLoading: (loading) => set((state) => {
                state.isLoading = loading;
            }, false, 'workspace/setLoading'),

            setError: (error) => set((state) => {
                state.error = error;
                state.isLoading = false;
            }, false, 'workspace/setError'),

            // Reset
            reset: () => set(() => initialState, false, 'workspace/reset'),
        })),
        { name: 'WorkspaceStore', enabled: import.meta.env.DEV }
    )
);

// Selectors for common derived state
export const selectCurrentPage = (state: WorkspaceState) =>
    state.pages.find(p => p.id === state.currentPageId);

export const selectFavoritePages = (state: WorkspaceState) =>
    state.pages.filter(p => p.isFavorite);

export const selectRootPages = (state: WorkspaceState) =>
    state.pageTree;
