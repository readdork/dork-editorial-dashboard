import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, RefreshCw, ExternalLink, Clock } from 'lucide-react'

interface FeedStory {
  id: string
  title: string
  url: string
  source: string
  summary: string
  full_content?: string
  published_at: string
}

export function FeedInbox() {
  const [stories, setStories] = useState<FeedStory[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [fetching, setFetching] = useState<string | null>(null)

  useEffect(() => {
    loadStories()
  }, [])

  async function loadStories() {
    setLoading(true)
    const { data } = await supabase
      .from('editorial_stories')
      .select('*')
      .eq('status', 'pending')
      .eq('source_type', 'rss')
      .order('published_at', { ascending: false })
    setStories(data || [])
    setLastRefresh(new Date())
    setLoading(false)
  }

  async function refreshFeeds() {
    setLoading(true)
    try {
      // Trigger RSS import only (Feedly is automatic, don't waste API calls)
      await fetch('/.netlify/functions/trigger-rss-import', { method: 'POST' })
    } catch (e) {
      // Ignore errors, just reload
    }
    // Always reload from database
    await loadStories()
  }

  async function approve(id: string) {
    await supabase.from('editorial_stories').update({ status: 'approved' }).eq('id', id)
    setStories(stories.filter(s => s.id !== id))
  }

  async function reject(id: string) {
    await supabase.from('editorial_stories').update({ status: 'rejected' }).eq('id', id)
    setStories(stories.filter(s => s.id !== id))
  }

  async function fetchFullContent(storyId: string) {
    setFetching(storyId)
    try {
      const response = await fetch(`/.netlify/functions/fetch-article?id=${storyId}`)
      if (response.ok) {
        await loadStories()
      }
    } catch (e) {
      console.error('Failed to fetch:', e)
    }
    setFetching(null)
  }

  function formatTimeAgo(date: string) {
    const now = new Date()
    const then = new Date(date)
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000)
    
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  if (loading) return (
    <div className="p-8 flex justify-center">
      <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
    </div>
  )

  return (
    <div className="p-3 sm:p-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Feed Inbox</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">Updated {formatTimeAgo(lastRefresh.toISOString())}</span>
          <button 
            onClick={refreshFeeds} 
            className="p-2 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition-colors"
            title="Refresh RSS feeds"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {stories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No pending items</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map(story => (
            <article key={story.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight">{story.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500">
                      <span className="font-medium text-blue-600">{story.source}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(story.published_at)}
                      </span>
                    </div>
                  </div>
                  
                  <a 
                    href={story.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                
                {expanded === story.id ? (
                  <div className="mt-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                      {story.full_content || story.summary}
                    </div>
                    {!story.full_content && (
                      <button
                        onClick={() => fetchFullContent(story.id)}
                        disabled={fetching === story.id}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                      >
                        {fetching === story.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Fetch full article
                          </>
                        )}
                      </button>
                    )}
                    <a
                      href={story.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 ml-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on {story.source}
                    </a>
                    <button
                      onClick={() => setExpanded(null)}
                      className="mt-2 ml-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <ChevronUp className="w-4 h-4" /> Show less
                    </button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{story.summary}</p>
                    <button 
                      onClick={() => setExpanded(story.id)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                    >
                      <ChevronDown className="w-4 h-4" /> Read more
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => approve(story.id)} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button 
                    onClick={() => reject(story.id)} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
