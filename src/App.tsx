import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { AppStateProvider } from './state/AppState'

function Yakinda() {
  return (
    <Layout>
      <p>Yakında</p>
    </Layout>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <HomePage />
          </Layout>
        }
      />
      <Route path="/modul/:modulId" element={<Yakinda />} />
      <Route path="/modul/:modulId/part/:partId" element={<Yakinda />} />
      <Route path="/modul/:modulId/part/:partId/test" element={<Yakinda />} />
      <Route path="/modul/:modulId/sinav" element={<Yakinda />} />
      <Route path="/defter" element={<Yakinda />} />
      <Route path="/kartlar" element={<Yakinda />} />
      <Route path="/ilerleme" element={<Yakinda />} />
      <Route path="/ayarlar" element={<Yakinda />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppStateProvider>
        <AppRoutes />
      </AppStateProvider>
    </HashRouter>
  )
}
