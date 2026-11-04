import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ModulePage } from './pages/ModulePage'
import { PartPage } from './pages/PartPage'
import { ExamPage } from './pages/ExamPage'
import { PartTestPage } from './pages/PartTestPage'
import { MistakesPage } from './pages/MistakesPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { ProgressPage } from './pages/ProgressPage'
import { SettingsPage } from './pages/SettingsPage'
import { AppStateProvider } from './state/AppState'

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
      <Route
        path="/defter"
        element={
          <Layout>
            <MistakesPage />
          </Layout>
        }
      />
      <Route
        path="/kartlar"
        element={
          <Layout>
            <FlashcardsPage />
          </Layout>
        }
      />
      <Route
        path="/ilerleme"
        element={
          <Layout>
            <ProgressPage />
          </Layout>
        }
      />
      <Route
        path="/ayarlar"
        element={
          <Layout>
            <SettingsPage />
          </Layout>
        }
      />
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
