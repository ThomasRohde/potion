/**
 * PageContext
 * 
 * Provides page operations context to child components.
 * Allows components like PageView to trigger sidebar refresh after title changes.
 */

import React, { createContext, useContext, useCallback, useState } from 'react'

interface PageContextValue {
    /**
     * Trigger a refresh of the page tree in the sidebar
     */
    refreshPages: () => Promise<void>
    
    /**
     * Register the refresh function from AppShell
     */
    setRefreshPages: (fn: () => Promise<void>) => void
}

const PageContext = createContext<PageContextValue | null>(null)

export function PageContextProvider({ children }: { children: React.ReactNode }) {
    const [refreshFn, setRefreshFn] = useState<(() => Promise<void>) | null>(null)
    
    const refreshPages = useCallback(async () => {
        if (refreshFn) {
            await refreshFn()
        }
    }, [refreshFn])
    
    const setRefreshPages = useCallback((fn: () => Promise<void>) => {
        setRefreshFn(() => fn)
    }, [])
    
    return (
        <PageContext.Provider value={{ refreshPages, setRefreshPages }}>
            {children}
        </PageContext.Provider>
    )
}

export function usePageContext() {
    const context = useContext(PageContext)
    if (!context) {
        throw new Error('usePageContext must be used within a PageContextProvider')
    }
    return context
}
