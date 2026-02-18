import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './lib/auth'
import { LoginScreen } from './components/LoginScreen'
import { Layout } from './components/Layout'
import { FeedInbox } from './components/FeedInbox'
import { DraftQueue } from './components/DraftQueue'
import { WordPressManager } from './components/WordPressManager'
import { BarryImport } from './components/BarryImport'
import { Notifications } from './components/Notifications'

function AppContent() {
  const { isAuthenticated, userRole, logout } = useAuth()

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <BrowserRouter>
      <Layout userRole={userRole!} onRoleSwitch={logout}>
        <Routes>
          <Route path="/" element={<FeedInbox userRole={userRole!} />} />
          <Route path="/drafts" element={<DraftQueue userRole={userRole!} />} />
          <Route path="/wordpress" element={<WordPressManager userRole={userRole!} />} />
          <Route path="/barry" element={<BarryImport userRole={userRole!} />} />
          <Route path="/notifications" element={<Notifications userRole={userRole!} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
