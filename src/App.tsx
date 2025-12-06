import { Routes, Route } from 'react-router-dom'
import { AppShell, PWAUpdatePrompt } from './components'
import { HomePage, PageView, NotFound } from './pages'
import { PageContextProvider } from './contexts'

function App() {
    return (
        <>
            <PageContextProvider>
                <AppShell>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/page/:id" element={<PageView />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AppShell>
            </PageContextProvider>
            <PWAUpdatePrompt />
        </>
    )
}

export default App
