import { useState, useEffect } from 'react'
import { supabase, type Draft } from '../lib/supabase'
import { CheckCircle, MessageSquare, Loader2, ChevronDown, ChevronUp, Trash2, Globe } from 'lucide-react'

export function Drafts() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)

  useEffect(() => {
    fetchDrafts()
  }, [])

  async function fetchDrafts() {
    const { data } = await supabase
      .from('editorial_drafts')
      .select('*')
      .in('status', ['draft', 'in_review'])
      .order('created_at', { ascending: false })
    setDrafts(data || [])
    setLoading(false)
  }

  async function approve(id: string) {
    await supabase.from('editorial_drafts').update({ status: 'approved' }).eq('id', id)
    setDrafts(drafts.filter(d => d.id !== id))
  }

  async function publishToWordPress(draft: Draft) {
    setPublishing(draft.id)
    try {
      // Call WordPress API
      const wpUrl = import.meta.env.VITE_WORDPRESS_URL
      const username = import.meta.env.VITE_WORDPRESS_USER
      const password = import.meta.env.VITE_WORDPRESS_APP_PASSWORD
      
      const auth = btoa(`${username}:${password}`)
      
      const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          excerpt: draft.excerpt,
          slug: draft.slug,
          status: 'draft'
        })
      })

      if (!response.ok) {
        throw new Error('WordPress publish failed')
      }

      const wpPost = await response.json()
      
      // Update draft with WP ID
      await supabase.from('editorial_drafts').update({
        status: 'approved',
        wordpress_post_id: wpPost.id,
        wordpress_status: 'draft'
      }).eq('id', draft.id)

      setDrafts(drafts.filter(d => d.id !== draft.id))
      alert(`Published to WordPress as draft. ID: ${wpPost.id}`)
    } catch (err) {
      alert('Failed to publish to WordPress')
      console.error(err)
    } finally {
      setPublishing(null)
    }
  }

  async function deleteDraft(id: string) {
    if (!confirm('Delete this draft?')) return
    await supabase.from('editorial_drafts').delete().eq('id', id)
    setDrafts(drafts.filter(d => d.id !== id))
  }

  async function sendFeedback(id: string) {
    if (!feedback.trim()) return
    await supabase.from('editorial_drafts').update({ 
      status: 'draft',
      feedback: feedback 
    }).eq('id', id)
    setDrafts(drafts.map(d => d.id === id ? { ...d, status: 'draft', feedback } : d))
    setFeedback('')
    setShowFeedback(null)
  }

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Drafts ({drafts.length})</h1>
      {drafts.length === 0 ? (
        <p className="text-gray-500">No drafts waiting</p>
      ) : (
        drafts.map(draft => (
          <div key={draft.id} className="border p-4 mb-3 rounded shadow-sm">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{draft.title}</h3>
              <button onClick={() => deleteDraft(draft.id)} className="text-gray-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-1">Status: {draft.status}</p>
            
            {draft.feedback && (
              <div className="bg-amber-50 p-2 rounded mb-2">
                <p className="text-sm text-amber-800"><strong>Feedback:</strong> {draft.feedback}</p>
              </div>
            )}
            
            {expanded === draft.id ? (
              <div className="mb-3">
                <div className="bg-gray-50 p-3 text-sm" dangerouslySetInnerHTML={{ __html: draft.content }} />
                <button 
                  onClick={() => setExpanded(null)}
                  className="text-sm text-blue-600 flex items-center gap-1 mt-2"
                >
                  <ChevronUp className="w-4 h-4" /> Show less
                </button>
              </div>
            ) : (
              <div className="mb-3">
                <div className="bg-gray-50 p-3 text-sm line-clamp-3" dangerouslySetInnerHTML={{ __html: draft.content }} />
                <button 
                  onClick={() => setExpanded(draft.id)}
                  className="text-sm text-blue-600 flex items-center gap-1 mt-1"
                >
                  <ChevronDown className="w-4 h-4" /> Read full article
                </button>
              </div>
            )}
            
            {showFeedback === draft.id ? (
              <div className="mb-2">
                <textarea 
                  className="w-full border p-2 rounded mb-2"
                  rows={3}
                  placeholder="Your feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={() => sendFeedback(draft.id)} className="px-4 py-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">Send Feedback</button>
                  <button onClick={() => setShowFeedback(null)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => publishToWordPress(draft)} disabled={publishing === draft.id} className="flex items-center gap-1 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  <Globe className="w-4 h-4" /> {publishing === draft.id ? 'Publishing...' : 'Publish to WP'}
                </button>
                <button onClick={() => setShowFeedback(draft.id)} className="flex items-center gap-1 px-4 py-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                  <MessageSquare className="w-4 h-4" /> Request Changes
                </button>
                <button onClick={() => approve(draft.id)} className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200">
                  <CheckCircle className="w-4 h-4" /> Mark Approved
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
