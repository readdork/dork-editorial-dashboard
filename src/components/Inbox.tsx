import { useState, useEffect } from 'react'
import { supabase, type Story } from '../lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function Inbox() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    const { data } = await supabase
      .from('editorial_stories')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setStories(data || [])
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inbox ({stories.length})</h1>
      {stories.length === 0 ? (
        <p className="text-gray-500">No pending items</p>
      ) : (
        stories.map(story => (
          <div key={story.id} className="border p-4 mb-3 rounded">
            <h3 className="font-semibold">{story.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{story.source}</p>
            <p className="text-sm mb-3">{story.summary}</p>
            <div className="flex gap-2">
              <button onClick={() => approve(story.id)} className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded">
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => reject(story.id)} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
