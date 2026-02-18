import { useState, useEffect } from 'react'
import { supabase, type Draft } from '../lib/supabase'
import { CheckCircle, Loader2, Trash2, RefreshCw, Edit2, Save } from 'lucide-react'

interface ExtendedDraft extends Draft {
  section?: string
  artist_names?: string[]
  featured_image?: string
  wordpress_post_id?: number
  wordpress_status?: string
}

// WordPress section taxonomy term IDs
function getSectionTermId(section: string): number {
  const sections: Record<string, number> = {
    'Upset': 6,
    'Hype': 7,
    'Festivals': 8,
  }
  return sections[section] || 0
}

export function Drafts() {
  const [drafts, setDrafts] = useState<ExtendedDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ExtendedDraft>>({})
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [publishing, setPublishing] = useState<string | null>(null)

  useEffect(() => {
    fetchDrafts()
  }, [])

  async function fetchDrafts() {
    setLoading(true)
    const { data } = await supabase
      .from('editorial_drafts')
      .select('*')
      .in('status', ['draft', 'in_review'])
      .order('created_at', { ascending: false })
    setDrafts(data || [])
    setLastRefresh(new Date())
    setLoading(false)
  }

  function startEditing(draft: ExtendedDraft) {
    setEditing(draft.id)
    setEditForm({
      title: draft.title,
      slug: draft.slug,
      excerpt: draft.excerpt,
      content: draft.content,
      section: draft.section || '',
      artist_names: draft.artist_names || [],
      featured_image: draft.featured_image || ''
    })
  }

  async function saveEdit(id: string) {
    try {
      const { error } = await supabase.from('editorial_drafts').update(editForm).eq('id', id)
      if (error) throw error
      alert('Changes saved successfully')
      setEditing(null)
      fetchDrafts()
    } catch (err) {
      alert('Failed to save changes: ' + (err as Error).message)
      console.error(err)
    }
  }

  async function approveAndPublish(id: string) {
    const draft = drafts.find(d => d.id === id)
    if (!draft) return
    
    if (!confirm('Publish this draft to WordPress?')) return
    
    setPublishing(id)
    try {
      const gatewayUrl = '/.netlify/functions/wp-post'
      const gatewaySecret = 'dork-gateway-secret-2026'
      
      // Convert markdown bold to HTML for WordPress
      const wpContent = draft.content
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>\n')
      
      const payload = {
        action: 'create',
        post: {
          title: draft.title,
          content: wpContent,
          excerpt: draft.excerpt,
          slug: draft.slug,
          status: 'draft',
          author: 8,
          categories: [],
          tags: draft.artist_names || [],
          sections: draft.section ? [getSectionTermId(draft.section)] : []
        }
      }
      
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const bodyString = JSON.stringify(payload)
      
      // Create HMAC signature
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(gatewaySecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(`${timestamp}.${bodyString}`)
      )
      const sigHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Timestamp': timestamp,
          'X-Signature': sigHex
        },
        body: bodyString
      })

      const result = await response.json()
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(result.error || 'WordPress publish failed')
      }
      
      const wpPost = result
      
      await supabase.from('editorial_drafts').update({
        status: 'published',
        wordpress_post_id: wpPost.id,
        wordpress_status: 'draft'
      }).eq('id', id)

      setDrafts(drafts.filter(d => d.id !== id))
      alert(`Published to WordPress! Post ID: ${wpPost.id}`)
    } catch (err) {
      alert('Failed to publish: ' + (err as Error).message)
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

  function formatContentForDisplay(content: string) {
    // Strip HTML tags for display
    return content.replace(/\*\*/g, '').replace(/\n/g, '\n')
  }

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Drafts ({drafts.length})</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Updated: {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchDrafts} className="p-2 hover:bg-gray-100 rounded">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {drafts.length === 0 ? (
        <p className="text-gray-500">No drafts waiting</p>
      ) : (
        drafts.map(draft => (
          <div key={draft.id} className="border p-4 mb-3 rounded shadow-sm bg-white">
            {editing === draft.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full border p-2 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    value={editForm.slug || ''}
                    onChange={(e) => setEditForm({...editForm, slug: e.target.value})}
                    className="w-full border p-2 rounded font-mono text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Excerpt</label>
                  <textarea
                    value={editForm.excerpt || ''}
                    onChange={(e) => setEditForm({...editForm, excerpt: e.target.value})}
                    className="w-full border p-2 rounded"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Content (plain text)</label>
                  <textarea
                    value={editForm.content || ''}
                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                    className="w-full border p-2 rounded font-mono text-sm"
                    rows={15}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <select
                    value={editForm.section || ''}
                    onChange={(e) => setEditForm({...editForm, section: e.target.value})}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">None</option>
                    <option value="Upset">Upset</option>
                    <option value="Hype">Hype</option>
                    <option value="Festivals">Festivals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Artist Names (comma separated)</label>
                  <input
                    type="text"
                    value={(editForm.artist_names || []).join(', ')}
                    onChange={(e) => setEditForm({...editForm, artist_names: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    className="w-full border p-2 rounded"
                    placeholder="Artist 1, Artist 2, Artist 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Featured Image URL</label>
                  <input
                    type="text"
                    value={editForm.featured_image || ''}
                    onChange={(e) => setEditForm({...editForm, featured_image: e.target.value})}
                    className="w-full border p-2 rounded font-mono text-sm"
                    placeholder="https://..."
                  />
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => saveEdit(draft.id)}
                    className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button 
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{draft.title}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="font-mono">/{draft.slug}</span>
                      {draft.section && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{draft.section}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEditing(draft)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteDraft(draft.id)}
                      className="p-2 hover:bg-gray-100 rounded text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {draft.excerpt && (
                  <div className="bg-gray-50 p-2 rounded mb-3 text-sm text-gray-600">
                    <strong>Excerpt:</strong> {draft.excerpt}
                  </div>
                )}

                {(draft.artist_names || draft.section || draft.featured_image) && (
                  <div className="bg-blue-50 p-2 rounded mb-3 text-sm">
                    {draft.artist_names && draft.artist_names.length > 0 && (
                      <div><strong>Artists:</strong> {draft.artist_names.join(', ')}</div>
                    )}
                    {draft.section && (
                      <div><strong>Section:</strong> {draft.section}</div>
                    )}
                    {draft.featured_image && (
                      <div><strong>Image:</strong> {draft.featured_image.substring(0, 50)}...</div>
                    )}
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <pre className="text-sm whitespace-pre-wrap font-sans">{formatContentForDisplay(draft.content)}</pre>
                </div>
                
                
                {draft.wordpress_post_id && (
                  <div className="bg-green-50 p-2 rounded mb-3 text-sm text-green-700">
                    <strong>Published to WordPress:</strong> Post ID {draft.wordpress_post_id}
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  {!draft.wordpress_post_id ? (
                    <button 
                      onClick={() => approveAndPublish(draft.id)} 
                      disabled={publishing === draft.id}
                      className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <CheckCircle className="w-4 h-4" /> {publishing === draft.id ? 'Publishing...' : 'Approve & Publish to WP'}
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Published to WP (ID: {draft.wordpress_post_id})
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  )
}
