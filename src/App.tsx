import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/Layout'
import { FeedInbox } from './components/FeedInbox'
import { DraftQueue } from './components/DraftQueue'
import { WordPressManager } from './components/WordPressManager'
import { BarryImport } from './components/BarryImport'
import { Notifications } from './components/Notifications'
import { UserCircle, ArrowRight } from 'lucide-react'

type UserRole = 'dan' | 'stephen' | null

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null)

  if (!userRole) {
    return (
      <ThemeProvider>
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8 animate-slide-up">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-dork-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-dork-500/20"
              >
                <span className="text-white font-bold text-2xl">D</span>
              </div>
              <h1 className="text-2xl font-bold">DORK Editorial</h1>
              <p className="text-gray-500 dark:text-gray-400">Choose your role to continue</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setUserRole('dan')}
                className="w-full group p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-dork-300 dark:hover:border-dork-700 transition-all duration-300 text-left shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-dork-100 dark:bg-dork-900/30 flex items-center justify-center transition-transform group-hover:scale-110"
                  >
                    <UserCircle className="w-6 h-6 text-dork-600 dark:text-dork-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">Dan Harrison</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">AI Deputy Editor</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-dork-500 transition-colors" />
                </div>
              </button>

              <button
                onClick={() => setUserRole('stephen')}
                className="w-full group p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-dork-300 dark:hover:border-dork-700 transition-all duration-300 text-left shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-dork-100 dark:bg-dork-900/30 flex items-center justify-center transition-transform group-hover:scale-110"
                  >
                    <UserCircle className="w-6 h-6 text-dork-600 dark:text-dork-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">Stephen Ackroyd</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Editor</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-dork-500 transition-colors" />
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
