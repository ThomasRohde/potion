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
    searchPagesWithSnippets,
    duplicatePage,
    buildPageTree
} from './pageService'
export type { PageTreeNode, SearchResult } from './pageService'

export {
    createDatabase,
    createPropertyDefinition,
    createSelectOption,
    getDatabase,
    updateDatabaseProperties,
    addDatabaseProperty,
    updateDatabaseProperty,
    removeDatabaseProperty,
    updateDatabaseViews,
    deleteDatabase,
    createRow,
    getRow,
    listRows,
    getFullRows,
    updateRowValues,
    updateRowValue,
    updateRowTitle,
    deleteRow,
    PROPERTY_TYPE_LABELS,
    PROPERTY_TYPE_ICONS,
    SELECT_OPTION_COLORS
} from './databaseService'
export type { SelectOptionColor } from './databaseService'
