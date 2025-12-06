import { Routes, Route } from 'react-router-dom'
import { AppShell, PWAUpdatePrompt } from './components'
import { HomePage, PageView, NotFound } from './pages'

function App() {
    return (
        <>
            <AppShell>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/page/:id" element={<PageView />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AppShell>
            <PWAUpdatePrompt />
        </>
    )
}

export default App
