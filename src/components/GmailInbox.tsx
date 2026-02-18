import { useState, useEffect } from 'react'
import { supabase, type Story } from '../lib/supabase'
import { CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, RefreshCw, Mail } from 'lucide-react'

export function GmailInbox() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    setLoading(true)
    const { data } = await supabase
      .from('editorial_stories')
      .select('*')
      .eq('status', 'pending')
      .eq('source_type', 'gmail')
      .order('created_at', { ascending: false })
    setStories(data || [])
    setLastRefresh(new Date())
    setLoading(false)
  }

  async function approve(id: string) {
    await supabase.from('editorial_stories').update({ status: 'approved' }).eq('id', id)
    setStories(stories.filter(s => s.id !== id))
  }

  async function reject(id: string) {
    await supabase.from('editorial_stories').update({ status: 'rejected' }).eq('id', id)
    setStories(stories.filter(s => s.id !== id))
  }

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gmail Inbox ({stories.length})</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Updated: {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchStories} className="p-2 hover:bg-gray-100 rounded">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      {stories.length === 0 ? (
        <p className="text-gray-500">No pending Gmail items</p>
      ) : (
        stories.map(story => (
          <div key={story.id} className="border p-4 mb-3 rounded shadow-sm bg-white">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{story.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <span>{story.source}</span>
                  <span>•</span>
                  <span>{new Date(story.created_at).toLocaleString()}</span>
                </div>
                
                {expanded === story.id ? (
                  <div className="mb-3 mt-3">
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{story.summary}</p>
                    <button 
                      onClick={() => setExpanded(null)}
                      className="text-sm text-blue-600 flex items-center gap-1 mt-2"
                    >
                      <ChevronUp className="w-4 h-4" /> Show less
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 mt-3">
                    <p className="text-sm line-clamp-3">{story.summary}</p>
                    <button 
                      onClick={() => setExpanded(story.id)}
                      className="text-sm text-blue-600 flex items-center gap-1 mt-1"
                    >
                      <ChevronDown className="w-4 h-4" /> Read full email
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button onClick={() => approve(story.id)} className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => reject(story.id)} className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
