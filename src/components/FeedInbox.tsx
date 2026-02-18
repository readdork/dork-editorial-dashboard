import { useState, useEffect } from 'react'
import { supabase, type FeedItem } from '../lib/supabase'
import { telegramApi } from '../lib/telegram'
import { 
  CheckCircle, 
  XCircle, 
  Star, 
  ExternalLink, 
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface FeedInboxProps {
  userRole: 'dan' | 'stephen'
}

export function FeedInbox({ userRole }: FeedInboxProps) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', url: '', source: '', artist_name: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('feed_items')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    try {
      const { error } = await supabase
        .from('feed_items')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      
      setItems(items.map(item => 
        item.id === id ? { ...item, status: 'approved' } : item
      ))
    } catch (err) {
      alert('Failed to approve item')
    }
  }

  async function handleReject(id: string) {
    try {
      const { error } = await supabase
        .from('feed_items')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      
      setItems(items.map(item => 
        item.id === id ? { ...item, status: 'rejected' } : item
      ))
    } catch (err) {
      alert('Failed to reject item')
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.title || !newItem.url) return
    
    setAdding(true)
    try {
      const { data, error } = await supabase
        .from('feed_items')
        .insert([{
          title: newItem.title,
          url: newItem.url,
          source: newItem.source || 'Manual',
          artist_name: newItem.artist_name || null,
          status: 'pending',
          priority: false,
          created_by: userRole,
        }])
        .select()
        .single()
      
      if (error) throw error
      
      setItems([data, ...items])
      setShowAddModal(false)
      setNewItem({ title: '', url: '', source: '', artist_name: '' })
      
      // Notify other user
      const notifyUser = userRole === 'dan' ? 'Stephen' : 'Dan'
      await telegramApi.sendNotification(
        'New Feed Item Added',
        `${notifyUser} added: "${data.title}"`,
        'medium'
      )
    } catch (err) {
      alert('Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  const pendingItems = items.filter(item => item.status === 'pending')
  const approvedItems = items.filter(item => item.status === 'approved')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-dork-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed Inbox</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-dork-600 text-white rounded-md hover:bg-dork-700"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Pending Items */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          Pending ({pendingItems.length})
        </h2>
        
        {pendingItems.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending items</p>
        ) : (
          <div className="space-y-3">
            {pendingItems.map(item => (
              <div 
                key={item.id}
                className={`p-4 rounded-lg border ${item.priority ? 'border-dork-500 bg-dork-50 dark:bg-dork-950/30' : 'border-border bg-card'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.priority && <Star className="h-4 w-4 text-dork-500 fill-dork-500" />}
                      <h3 className="font-medium truncate">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.source}</p>
                    {item.artist_name && (
                      <p className="text-sm text-dork-600 dark:text-dork-400 mt-1">Artist: {item.artist_name}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md hover:bg-accent"
                      title="Open link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    
                    {userRole === 'stephen' && (
                      <>
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved Items */}
      {approvedItems.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Approved ({approvedItems.length})
          </h2>
          <div className="space-y-2">
            {approvedItems.slice(0, 5).map(item => (
              <div key={item.id} className="p-3 rounded-lg border border-border bg-card/50">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{item.title}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dork-600 hover:underline text-sm"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
            {approvedItems.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">+{approvedItems.length - 5} more</p>
            )}
          </div>
        </section>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Feed Item</h2>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">URL *</label>
                <input
                  type="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <input
                  type="text"
                  value={newItem.source}
                  onChange={(e) => setNewItem({ ...newItem, source: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="e.g., NME, Stereogum"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Artist Name</label>
                <input
                  type="text"
                  value={newItem.artist_name}
                  onChange={(e) => setNewItem({ ...newItem, artist_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="For priority tracking"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-md border border-input hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 rounded-md bg-dork-600 text-white hover:bg-dork-700 disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
