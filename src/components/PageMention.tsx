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
                // Navigate to the page
                if (pageId) {
                    window.location.hash = `/page/${pageId}`
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
