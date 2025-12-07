/**
 * PageMention Component (F069)
 * 
 * Custom inline content type for @ mentions that link to other pages.
 * Based on BlockNote's custom inline content API.
 */

import React from 'react'
import { createReactInlineContentSpec } from '@blocknote/react'
import { AtSign } from 'lucide-react'

/**
 * The PageMention inline content specification.
 * Creates a clickable mention that links to another page in the workspace.
 */
export const PageMention = createReactInlineContentSpec(
    {
        type: 'pageMention',
        propSchema: {
            pageId: {
                default: '',
            },
            pageTitle: {
                default: 'Untitled',
            },
        },
        content: 'none',
    },
    {
        render: (props) => {
            const { pageId, pageTitle } = props.inlineContent.props

            const handleClick = (e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                // Navigate to the page using History API (works with BrowserRouter)
                if (pageId) {
                    const basePath = import.meta.env.BASE_URL || '/'
                    const targetPath = `${basePath}page/${pageId}`.replace(/\/+/g, '/')
                    window.history.pushState({}, '', targetPath)
                    // Dispatch popstate event to notify React Router of the navigation
                    window.dispatchEvent(new PopStateEvent('popstate'))
                }
            }

            return (
                <span
                    className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors"
                    onClick={handleClick}
                    data-page-id={pageId}
                    data-inline-content-type="pageMention"
                >
                    <AtSign className="h-3 w-3" />
                    <span>{pageTitle || 'Untitled'}</span>
                </span>
            )
        },
        parse: (el) => {
            if (el.getAttribute('data-inline-content-type') === 'pageMention') {
                return {
                    pageId: el.getAttribute('data-page-id') || '',
                    pageTitle: el.textContent?.replace('@', '') || 'Untitled',
                }
            }
            return undefined
        },
    }
)

export type PageMentionProps = {
    pageId: string
    pageTitle: string
}
