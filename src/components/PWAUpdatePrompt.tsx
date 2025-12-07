import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'

export function PWAUpdatePrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setNeedRefresh(false)
    }

    if (!needRefresh) {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm z-50">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <svg
                        className="w-6 h-6 text-violet-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Update Available
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        A new version of Potion is available. Reload to update.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <Button
                            onClick={() => updateServiceWorker(true)}
                            size="sm"
                        >
                            Reload
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={close}
                        >
                            Later
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
