import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { Login } from './components/Login'
import { Inbox } from './components/Inbox'
import { Drafts } from './components/Drafts'
import { LogOut } from 'lucide-react'

function AppContent() {
  const { isAuthenticated, logout } = useAuth()
  const [tab, setTab] = useState<'inbox' | 'drafts'>('inbox')

  if (!isAuthenticated) return <Login />

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <header className="border-b p-4 flex justify-between items-center">
          <div className="flex gap-4">
            <button 
              onClick={() => setTab('inbox')}
              className={`px-4 py-2 rounded ${tab === 'inbox' ? 'bg-blue-100 text-blue-700' : ''}`}
            >
              Inbox
            </button>
            <button 
              onClick={() => setTab('drafts')}
              className={`px-4 py-2 rounded ${tab === 'drafts' ? 'bg-blue-100 text-blue-700' : ''}`}
            >
              Drafts
            </button>
          </div>
          
          <button onClick={logout} className="p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        
        {tab === 'inbox' ? <Inbox /> : <Drafts />}
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
