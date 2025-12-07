import { Routes, Route } from 'react-router-dom'
import { AppShell, PWAUpdatePrompt } from './components'
import { HomePage, PageView, NotFound } from './pages'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from './components/ui/sonner'

function App() {
    return (
        <TooltipProvider delayDuration={300}>
            <AppShell>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/page/:id" element={<PageView />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AppShell>
            <PWAUpdatePrompt />
            <Toaster richColors position="bottom-right" />
        </TooltipProvider>
    )
}

export default App
