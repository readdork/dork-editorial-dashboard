import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/Layout'
import { FeedInbox } from './components/FeedInbox'
import { DraftQueue } from './components/DraftQueue'
import { WordPressManager } from './components/WordPressManager'
import { BarryImport } from './components/BarryImport'
import { Notifications } from './components/Notifications'
import { UserCircle } from 'lucide-react'

type UserRole = 'dan' | 'stephen' | null

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null)

  if (!userRole) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-dork-600 dark:text-dork-400">DORK</h1>
              <p className="text-muted-foreground mt-2">Editorial Dashboard</p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setUserRole('dan')}
                className="p-6 rounded-lg border border-border bg-card hover:border-dork-300 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-dork-100 dark:bg-dork-900">
                    <UserCircle className="h-6 w-6 text-dork-600 dark:text-dork-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Dan Harrison</h2>
                    <p className="text-sm text-muted-foreground">AI Deputy Editor</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setUserRole('stephen')}
                className="p-6 rounded-lg border border-border bg-card hover:border-dork-300 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-dork-100 dark:bg-dork-900">
                    <UserCircle className="h-6 w-6 text-dork-600 dark:text-dork-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Stephen Ackroyd</h2>
                    <p className="text-sm text-muted-foreground">Editor</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout userRole={userRole} onRoleSwitch={() => setUserRole(null)}>
          <Routes>
            <Route path="/" element={<FeedInbox userRole={userRole} />} />
            <Route path="/drafts" element={<DraftQueue userRole={userRole} />} />
            <Route path="/wordpress" element={<WordPressManager userRole={userRole} />} />
            <Route path="/barry" element={<BarryImport userRole={userRole} />} />
            <Route path="/notifications" element={<Notifications userRole={userRole} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
