/**
 * PageIcon Component
 * 
 * Renders the appropriate icon for a page based on its type and custom icon.
 * Uses Lucide icons for default page types, emoji for custom icons.
 */

import { FileText, Database, Hand } from 'lucide-react'
import type { PageType } from '../types'

interface PageIconProps {
    type: PageType
    icon?: string | null
    className?: string
    /** Size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-12 h-12'
}

const emojiSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
    xl: 'text-5xl'
}

/**
 * Renders page icon based on type and custom icon setting.
 * 
 * If page has a custom icon (emoji), renders it directly.
 * Otherwise, renders the appropriate Lucide icon based on page type.
 */
export function PageIcon({ type, icon, className = '', size = 'md' }: PageIconProps) {
    // If custom icon is set (non-empty string), render it as emoji
    if (icon) {
        return (
            <span className={`${emojiSizeClasses[size]} ${className}`}>
                {icon}
            </span>
        )
    }

    // Render Lucide icon based on page type
    const iconClassName = `${sizeClasses[size]} ${className}`

    switch (type) {
        case 'database':
            return <Database className={iconClassName} />
        case 'page':
        default:
            return <FileText className={iconClassName} />
    }
}

/**
 * Standalone Hand icon for welcome pages.
 * Used in onboarding content sections.
 */
export function WelcomeIcon({ className = '', size = 'md' }: Pick<PageIconProps, 'className' | 'size'>) {
    const iconClassName = `${sizeClasses[size]} ${className}`
    return <Hand className={iconClassName} />
}
