import { useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { Login } from './components/Login'
import { Inbox } from './components/Inbox'
import { Drafts } from './components/Drafts'
import { LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'

function AppContent() {
  const { isAuthenticated, logout } = useAuth()
  const [tab, setTab] = useState<'inbox' | 'drafts'>('inbox')
  const [inboxCount, setInboxCount] = useState(0)
  const [draftsCount, setDraftsCount] = useState(0)

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchCounts() {
    const { count: inbox } = await supabase
      .from('editorial_stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    const { count: drafts } = await supabase
      .from('editorial_drafts')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'in_review'])
    
    setInboxCount(inbox || 0)
    setDraftsCount(drafts || 0)
  }

  if (!isAuthenticated) return <Login />

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex gap-2">
            <button 
              onClick={() => setTab('inbox')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${tab === 'inbox' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Inbox
              {inboxCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{inboxCount}</span>}
            </button>
            <button 
              onClick={() => setTab('drafts')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${tab === 'drafts' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Drafts
              {draftsCount > 0 && <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{draftsCount}</span>}
            </button>
          </div>
          
          <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg">
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
