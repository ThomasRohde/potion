/**
 * NotFound Component
 * 
 * 404 page for invalid routes.
 */

import { useNavigate } from 'react-router-dom'

export function NotFound() {
    const navigate = useNavigate()

    return (
        <div className="max-w-4xl mx-auto px-8 py-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                404 - Page Not Found
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
                The page you're looking for doesn't exist or the URL is incorrect.
            </p>
            <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-potion-600 text-white rounded-lg hover:bg-potion-700 transition-colors"
            >
                Go to Home
            </button>
        </div>
    )
}
