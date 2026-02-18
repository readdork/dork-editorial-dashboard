import { useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { Login } from './components/Login'
import { FeedInbox } from './components/FeedInbox'
import { GmailInbox } from './components/GmailInbox'
import { Drafts } from './components/Drafts'
import { LogOut, Rss, Mail, FileText } from 'lucide-react'
import { supabase } from './lib/supabase'

function AppContent() {
  const { isAuthenticated, logout } = useAuth()
  const [tab, setTab] = useState<'feed' | 'gmail' | 'drafts'>('feed')
  const [feedCount, setFeedCount] = useState(0)
  const [gmailCount, setGmailCount] = useState(0)
  const [draftsCount, setDraftsCount] = useState(0)

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchCounts() {
    const { count: feed } = await supabase
      .from('editorial_stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('source_type', 'rss')
    
    const { count: gmail } = await supabase
      .from('editorial_stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('source_type', 'gmail')
    
    const { count: drafts } = await supabase
      .from('editorial_drafts')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'in_review'])
    
    setFeedCount(feed || 0)
    setGmailCount(gmail || 0)
    setDraftsCount(drafts || 0)
  }

  if (!isAuthenticated) return <Login />

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white border-b border-gray-200 p-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex gap-2 overflow-x-auto">
            <button 
              onClick={() => setTab('feed')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${tab === 'feed' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <Rss className="w-4 h-4" /> 
              <span className="hidden sm:inline">Feed</span>
              {feedCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{feedCount}</span>}
            </button>
            
            <button 
              onClick={() => setTab('gmail')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${tab === 'gmail' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <Mail className="w-4 h-4" /> 
              <span className="hidden sm:inline">Gmail</span>
              {gmailCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{gmailCount}</span>}
            </button>
            
            <button 
              onClick={() => setTab('drafts')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${tab === 'drafts' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <FileText className="w-4 h-4" /> 
              <span className="hidden sm:inline">Drafts</span>
              {draftsCount > 0 && <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{draftsCount}</span>}
            </button>
          </div>
          
          <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        
        <main className="pb-8">
          {tab === 'feed' && <FeedInbox />}
          {tab === 'gmail' && <GmailInbox />}
          {tab === 'drafts' && <Drafts />}
        </main>
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
