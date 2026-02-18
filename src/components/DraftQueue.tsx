import { useState, useEffect } from 'react'
import { supabase, type Draft } from '../lib/supabase'
import { wordpressApi } from '../lib/wordpress'
import { cloudinaryApi } from '../lib/cloudinary'
import { telegramApi } from '../lib/telegram'
import { 
  Plus, 
  Edit2, 
  Upload, 
  CheckCircle, 
  Loader2, 
  Image as ImageIcon,
  Eye,
  Send
} from 'lucide-react'

interface DraftQueueProps {
  userRole: 'dan' | 'stephen'
}

export function DraftQueue({ userRole }: DraftQueueProps) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchDrafts()
  }, [])

  async function fetchDrafts() {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDrafts(data || [])
    } catch (err) {
      console.error('Failed to fetch drafts:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(draft: Draft) {
    setEditingDraft(draft)
    setFormData({
      title: draft.title,
      slug: draft.slug,
      excerpt: draft.excerpt,
      content: draft.content,
      featured_image: draft.featured_image || '',
    })
    setShowEditor(true)
  }

  function handleNew() {
    setEditingDraft(null)
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
    })
    setShowEditor(true)
  }

  async function handleSave(asStatus: 'draft' | 'in_review' = 'draft') {
    setSaving(true)
    try {
      const draftData = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image: formData.featured_image || undefined,
        status: asStatus,
        updated_at: new Date().toISOString(),
      }

      if (editingDraft) {
        const { error } = await supabase
          .from('drafts')
          .update(draftData)
          .eq('id', editingDraft.id)
        
        if (error) throw error
        
        setDrafts(drafts.map(d => d.id === editingDraft.id ? { ...d, ...draftData } : d))
      } else {
        const { data, error } = await supabase
          .from('drafts')
          .insert([{ ...draftData, created_by: userRole }])
          .select()
          .single()
        
        if (error) throw error
        setDrafts([data, ...drafts])
      }

      if (asStatus === 'in_review') {
        await telegramApi.sendNotification(
          'Draft Ready for Review',
          `"${formData.title}" is ready for Stephen's review`,
          'medium'
        )
      }

      setShowEditor(false)
    } catch (err) {
      alert('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublishToWordPress() {
    if (!editingDraft) return
    
    setPublishing(true)
    try {
      // Create post in WordPress
      const wpPost = await wordpressApi.createPost({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        slug: formData.slug,
        status: 'draft',
      })

      // Update draft with WordPress info
      const { error } = await supabase
        .from('drafts')
        .update({
          status: 'approved',
          wordpress_post_id: wpPost.id,
          wordpress_status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingDraft.id)

      if (error) throw error

      await telegramApi.sendNotification(
        'Draft Published to WordPress',
        `"${formData.title}" has been pushed to WordPress as a draft`,
        'high'
      )

      setDrafts(drafts.map(d => 
        d.id === editingDraft.id 
          ? { ...d, status: 'approved', wordpress_post_id: wpPost.id, wordpress_status: 'draft' }
          : d
      ))
      setShowEditor(false)
    } catch (err) {
      alert('Failed to publish to WordPress')
    } finally {
      setPublishing(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const url = await cloudinaryApi.uploadImage(file)
      setFormData({ ...formData, featured_image: url })
    } catch (err) {
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleApprove(draftId: string) {
    try {
      const { error } = await supabase
        .from('drafts')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', draftId)
      
      if (error) throw error
      
      setDrafts(drafts.map(d => d.id === draftId ? { ...d, status: 'approved' } : d))
    } catch (err) {
      alert('Failed to approve draft')
    }
  }

  const draftDrafts = drafts.filter(d => d.status === 'draft')
  const reviewDrafts = drafts.filter(d => d.status === 'in_review')
  const approvedDrafts = drafts.filter(d => d.status === 'approved' || d.status === 'published')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-dork-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Draft Queue</h1>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-dork-600 text-white rounded-md hover:bg-dork-700"
        >
          <Plus className="h-4 w-4" />
          New Draft
        </button>
      </div>

      {!showEditor ? (
        <div className="space-y-6">
          {/* In Review */}
          {reviewDrafts.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                In Review ({reviewDrafts.length})
              </h2>
              <div className="grid gap-3">
                {reviewDrafts.map(draft => (
                  <DraftCard 
                    key={draft.id} 
                    draft={draft} 
                    onEdit={handleEdit}
                    userRole={userRole}
                    onApprove={handleApprove}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Drafts */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Drafts ({draftDrafts.length})
            </h2>
            <div className="grid gap-3">
              {draftDrafts.map(draft => (
                <DraftCard 
                  key={draft.id} 
                  draft={draft} 
                  onEdit={handleEdit}
                  userRole={userRole}
                />
              ))}
            </div>
          </section>

          {/* Approved/Published */}
          {approvedDrafts.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Approved & Published ({approvedDrafts.length})
              </h2>
              <div className="grid gap-3">
                {approvedDrafts.slice(0, 5).map(draft => (
                  <DraftCard 
                    key={draft.id} 
                    draft={draft} 
                    onEdit={handleEdit}
                    userRole={userRole}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingDraft ? 'Edit Draft' : 'New Draft'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                placeholder="auto-generated-from-title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="w-full px-3 py-2 rounded-md border border-input bg-background font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Featured Image</label>
              <div className="flex items-center gap-4">
                {formData.featured_image ? (
                  <img 
                    src={formData.featured_image} 
                    alt="Featured" 
                    className="h-20 w-20 object-cover rounded-md"
                  />
                ) : (
                  <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-input hover:bg-accent cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 rounded-md border border-input hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
              </div>

              <div className="flex gap-2">
                {userRole === 'dan' && editingDraft?.status !== 'approved' && (
                  <button
                    onClick={() => handleSave('in_review')}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
                  >
                    <Eye className="h-4 w-4" />
                    Submit for Review
                  </button>
                )}
                
                {userRole === 'stephen' && editingDraft && (
                  <button
                    onClick={handlePublishToWordPress}
                    disabled={publishing}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {publishing ? 'Publishing...' : 'Push to WordPress'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DraftCard({ 
  draft, 
  onEdit, 
  userRole,
  onApprove 
}: { 
  draft: Draft
  onEdit: (draft: Draft) => void
  userRole: 'dan' | 'stephen'
  onApprove?: (id: string) => void
}) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:border-dork-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{draft.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{draft.excerpt}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className={`
              px-2 py-0.5 rounded-full
              ${draft.status === 'draft' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800' : ''}
              ${draft.status === 'in_review' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900' : ''}
              ${draft.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900' : ''}
              ${draft.status === 'published' ? 'bg-dork-100 text-dork-700 dark:bg-dork-900' : ''}
            `}>
              {draft.status.replace('_', ' ')}
            </span>
            {draft.wordpress_post_id && <span>WP #{draft.wordpress_post_id}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(draft)}
            className="p-2 rounded-md hover:bg-accent"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          
          {userRole === 'stephen' && draft.status === 'in_review' && onApprove && (
            <button
              onClick={() => onApprove(draft.id)}
              className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
              title="Approve"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
