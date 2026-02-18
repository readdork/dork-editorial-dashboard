import { useState, useEffect } from 'react'
import { supabase, type Draft } from '../lib/supabase'
import { CheckCircle, MessageSquare, Loader2 } from 'lucide-react'

export function Drafts() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState<string | null>(null)

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Drafts ({drafts.length})</h1>
      {drafts.length === 0 ? (
        <p className="text-gray-500">No drafts waiting</p>
      ) : (
        drafts.map(draft => (
          <div key={draft.id} className="border p-4 mb-3 rounded">
            <h3 className="font-semibold">{draft.title}</h3>
            <p className="text-sm text-gray-600 mb-1">Status: {draft.status}</p>
            {draft.feedback && (
              <p className="text-sm text-amber-600 mb-2">Feedback: {draft.feedback}</p>
            )}
            <div className="bg-gray-50 p-3 mb-3 text-sm max-h-40 overflow-y-auto">
              {draft.content}
            </div>
            
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
                  <button onClick={() => sendFeedback(draft.id)} className="px-3 py-1 bg-amber-100 text-amber-700 rounded">Send</button>
                  <button onClick={() => setShowFeedback(null)} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => approve(draft.id)} className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => setShowFeedback(draft.id)} className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded">
                  <MessageSquare className="w-4 h-4" /> Feedback
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
