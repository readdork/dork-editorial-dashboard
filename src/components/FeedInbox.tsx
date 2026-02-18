import { useState, useEffect } from 'react'
import { supabase, type Story } from '../lib/supabase'
import { telegramApi } from '../lib/telegram'
import { 
  CheckCircle, 
  XCircle, 
  Star, 
  ExternalLink, 
  Plus,
  Loader2,
  AlertCircle,
  Inbox,
  Search
} from 'lucide-react'

interface FeedInboxProps {
  userRole: 'dan' | 'stephen'
}

export function FeedInbox({ userRole }: FeedInboxProps) {
  const [items, setItems] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', url: '', source: '', artist_names: '' })
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('editorial_stories')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed items')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    try {
      // Update story status
      const { error: updateError } = await supabase
        .from('editorial_stories')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      // Get the story details
      const story = items.find(i => i.id === id)
      if (story) {
        // Create a draft
        const slug = story.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 50)
        
        const { error: draftError } = await supabase
          .from('editorial_drafts')
          .insert([{
            story_id: id,
            title: story.title,
            slug: slug,
            excerpt: story.summary || `${story.title} - latest news from ${story.source}`,
            content: `<p>${story.summary || 'Write article content here...'}</p>`,
            featured_image: story.image_url,
            status: 'draft',
            created_by: 'dan'
          }])
        
        if (draftError) throw draftError
        
        // Notify via Telegram
        await telegramApi.sendNotification(
          'Story Approved & Draft Created',
          `Stephen approved "${story.title}"\nDan has created a draft.`,
          'high'
        )
      }
      
      setItems(items.map(item => 
        item.id === id ? { ...item, status: 'approved' } : item
      ))
    } catch (err) {
      alert('Could not approve item. Try again.')
    }
  }

  async function handleReject(id: string) {
    try {
      const { error } = await supabase
        .from('editorial_stories')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      
      setItems(items.map(item => 
        item.id === id ? { ...item, status: 'rejected' } : item
      ))
    } catch (err) {
      alert('Could not reject item. Try again.')
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.title || !newItem.url) return
    
    setAdding(true)
    try {
      const { data, error } = await supabase
        .from('editorial_stories')
        .insert([{
          title: newItem.title,
          url: newItem.url,
          source: newItem.source || 'Manual',
          artist_names: newItem.artist_names || null,
          status: 'pending',
          priority: false,
          created_by: userRole,
        }])
        .select()
        .single()
      
      if (error) throw error
      
      setItems([data, ...items])
      setShowAddModal(false)
      setNewItem({ title: '', url: '', source: '', artist_names: '' })
      
      const notifyUser = userRole === 'dan' ? 'Stephen' : 'Dan'
      await telegramApi.sendNotification(
        'New story added',
        `${notifyUser} added "${data.title}" to the feed`,
        'medium'
      )
    } catch (err) {
      alert('Could not add item. Check your connection.')
    } finally {
      setAdding(false)
    }
  }

  const filteredItems = items.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const pendingCount = items.filter(i => i.status === 'pending').length
  const approvedCount = items.filter(i => i.status === 'approved').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-dork-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Feed Inbox</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pendingCount} pending, {approvedCount} approved
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary self-start"
        >
          <Plus className="w-4 h-4" />
          Add story
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="editor-input pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-dork-100 text-dork-700 dark:bg-dork-900/30 dark:text-dork-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No stories found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <StoryCard 
              key={item.id}
              item={item}
              userRole={userRole}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-4">Add new story</h2>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="editor-input"
                  placeholder="What's the story?"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">URL</label>
                <input
                  type="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="editor-input"
                  placeholder="https://..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Source</label>
                  <input
                    type="text"
                    value={newItem.source}
                    onChange={(e) => setNewItem({ ...newItem, source: e.target.value })}
                    className="editor-input"
                    placeholder="NME, Stereogum..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">Artist (optional)</label>
                  <input
                    type="text"
                    value={newItem.artist_names}
                    onChange={(e) => setNewItem({ ...newItem, artist_names: e.target.value })}
                    className="editor-input"
                    placeholder="Artist name"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="btn-primary"
                >
                  {adding ? 'Adding...' : 'Add story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StoryCard({ 
  item, 
  userRole,
  onApprove,
  onReject
}: { 
  item: Story
  userRole: 'dan' | 'stephen'
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const statusClasses: Record<string, string> = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
  }

  return (
    <div className={`editor-card ${item.priority ? 'ring-2 ring-dork-500/20' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Priority indicator */}
        {item.priority && (
          <div className="flex-shrink-0">
            <Star className="w-5 h-5 text-dork-500 fill-dork-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-lg leading-tight">{item.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className={statusClasses[item.status]}>{item.status}</span>
                <span>•</span>
                <span>{item.source}</span>
                {item.artist_names && (
                  <>
                    <span>•</span>
                    <span className="text-dork-600 dark:text-dork-400">{item.artist_names}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Open link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              {userRole === 'stephen' && item.status === 'pending' && (
                <>
                  <button
                    onClick={() => onApprove(item.id)}
                    className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                    title="Approve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onReject(item.id)}
                    className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
