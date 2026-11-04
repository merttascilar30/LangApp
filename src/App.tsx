import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ModulePage } from './pages/ModulePage'
import { PartPage } from './pages/PartPage'
import { ExamPage } from './pages/ExamPage'
import { PartTestPage } from './pages/PartTestPage'
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
      <Route
        path="/modul/:modulId"
        element={
          <Layout>
            <ModulePage />
          </Layout>
        }
      />
      <Route
        path="/modul/:modulId/part/:partId"
        element={
          <Layout>
            <PartPage />
          </Layout>
        }
      />
      <Route
        path="/modul/:modulId/part/:partId/test"
        element={
          <Layout>
            <PartTestPage />
          </Layout>
        }
      />
      <Route
        path="/modul/:modulId/sinav"
        element={
          <Layout>
            <ExamPage />
          </Layout>
        }
      />
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
