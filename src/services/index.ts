/**
 * Services Module Exports
 * 
 * High-level business logic APIs for the application.
 */

export * from './workspaceService'
export {
    createPage,
    createEmptyContent,
    getPage,
    listPages,
    getChildPages,
    getRootPages,
    getFavoritePages,
    updatePageTitle,
    updatePageContent,
    updatePage,
    togglePageFavorite,
    movePage,
    deletePage,
    orphanChildren,
    searchPages,
    duplicatePage,
    buildPageTree
} from './pageService'
export type { PageTreeNode } from './pageService'
