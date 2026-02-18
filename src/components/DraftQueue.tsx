import { useState, useEffect } from 'react'
import { supabase, type Draft } from '../lib/supabase'
import { wordpressApi } from '../lib/wordpress'
import { cloudinaryApi } from '../lib/cloudinary'
import { telegramApi } from '../lib/telegram'
import { RichTextEditor } from './RichTextEditor'
import { 
  Plus, 
  Edit2, 
  Loader2, 
  Image as ImageIcon,
  Send,
  FileText,
  X,
  Save,
  RefreshCw,
  Globe,
  Database
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
  const [activeTab, setActiveTab] = useState<'draft' | 'in_review' | 'approved'>('draft')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    section: 'None' as 'Upset' | 'Hype' | 'Festivals' | 'None',
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchDrafts()
  }, [])

  async function fetchDrafts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('editorial_drafts')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setDrafts(data || [])
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to load drafts:', err)
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
      section: (draft as any).section || 'None',
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
      section: 'None',
    })
    setShowEditor(true)
  }

  async function handleSave(asStatus: 'draft' | 'in_review' = 'draft') {
    setSaving(true)
    try {
      const slug = formData.slug || formData.title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 60)

      const draftData = {
        title: formData.title,
        slug,
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image: formData.featured_image || undefined,
        status: asStatus,
        updated_at: new Date().toISOString(),
        section: formData.section,
      }

      if (editingDraft) {
        const { error } = await supabase
          .from('editorial_drafts')
          .update(draftData)
          .eq('id', editingDraft.id)
        
        if (error) throw error
        
        setDrafts(drafts.map(d => d.id === editingDraft.id ? { ...d, ...draftData } : d))
      } else {
        const { data, error } = await supabase
          .from('editorial_drafts')
          .insert([{ ...draftData, created_by: userRole, created_at: new Date().toISOString() }])
          .select()
          .single()
        
        if (error) throw error
        setDrafts([data, ...drafts])
      }

      setShowEditor(false)
    } catch (err) {
      alert('Could not save draft. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // Dan submits for review
  async function handleSubmitForReview() {
    await handleSave('in_review')
    
    await telegramApi.sendNotification(
      'Draft Ready for Review',
      `"${formData.title}" is ready for Stephen's approval`,
      'medium'
    )
  }

  // Stephen approves and publishes to WordPress
  async function handleApproveAndPublish() {
    if (!editingDraft) return
    
    setPublishing(true)
    try {
      // First save as in_review (not approved yet, that happens after WP publish)
      await handleSave('in_review')
      
      // Then publish to WordPress
      const wpPost = await wordpressApi.createPost({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        slug: formData.slug,
        status: 'draft', // Always publish as draft first
      })

      const { error } = await supabase
        .from('editorial_drafts')
        .update({
          wordpress_post_id: wpPost.id,
          wordpress_status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingDraft.id)

      if (error) throw error

      await telegramApi.sendNotification(
        'Published to WordPress',
        `"${formData.title}" is now in WordPress as a draft (ID: ${wpPost.id})`,
        'high'
      )

      setDrafts(drafts.map(d => 
        d.id === editingDraft.id 
          ? { ...d, status: 'approved', wordpress_post_id: wpPost.id, wordpress_status: 'draft' }
          : d
      ))
      setShowEditor(false)
    } catch (err) {
      alert('Could not publish to WordPress. Check your credentials.')
    } finally {
      setPublishing(false)
    }
  }

  // Mark as imported to Barry
  async function handleMarkBarryImported(draftId: string) {
    try {
      const { error } = await supabase
        .from('editorial_drafts')
        .update({ barry_imported: true, updated_at: new Date().toISOString() })
        .eq('id', draftId)
      
      if (error) throw error
      
      setDrafts(drafts.map(d => d.id === draftId ? { ...d, barry_imported: true } : d))
      
      await telegramApi.sendNotification(
        'Barry Import Complete',
        'Article has been imported to Barry',
        'low'
      )
    } catch (err) {
      alert('Could not update import status.')
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
      alert('Could not upload image. Try a smaller file.')
    } finally {
      setUploadingImage(false)
    }
  }

  const filteredDrafts = drafts.filter(d => {
    if (activeTab === 'approved') return d.status === 'approved' || d.status === 'published'
    return d.status === activeTab
  })

  const counts = {
    draft: drafts.filter(d => d.status === 'draft').length,
    in_review: drafts.filter(d => d.status === 'in_review').length,
    approved: drafts.filter(d => d.status === 'approved' || d.status === 'published').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-dork-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Draft Queue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {counts.draft} draft, {counts.in_review} in review, {counts.approved} approved
            <span className="ml-2 text-xs">(Refreshed: {lastRefresh.toLocaleTimeString()})</span>
          </p>
        </div>
        
        <div className="flex gap-2 self-start">
          <button
            onClick={fetchDrafts}
            disabled={loading}
            className="btn-secondary"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleNew}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New draft
          </button>
        </div>
      </div>

      {!showEditor ? (
        <>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
            {(['draft', 'in_review', 'approved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-700 text-dork-600 dark:text-dork-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'draft' && `Drafts (${counts.draft})`}
                {tab === 'in_review' && `In Review (${counts.in_review})`}
                {tab === 'approved' && `Approved (${counts.approved})`}
              </button>
            ))}
          </div>

          {/* Drafts List */}
          <div className="space-y-3">
            {filteredDrafts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No drafts in this section</p>
              </div>
            ) : (
              filteredDrafts.map((draft) => (
                <DraftCard 
                  key={draft.id}
                  draft={draft}
                  userRole={userRole}
                  onEdit={handleEdit}
                  onMarkBarryImported={handleMarkBarryImported}
                />
              ))
            )}
          </div>
        </>
      ) : (
        /* Editor */
        <div className="editor-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingDraft ? 'Edit Draft' : 'New Draft'}
            </h2>
            <button
              onClick={() => setShowEditor(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="editor-input"
                placeholder="Article title"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="editor-input"
                placeholder="auto-generated-from-title"
              />
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value as any })}
                className="editor-input"
              >
                <option value="None">None</option>
                <option value="Upset">Upset (Rock/Punk/Metal)</option>
                <option value="Hype">Hype (New Artists)</option>
                <option value="Festivals">Festivals</option>
              </select>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium mb-1">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="editor-input"
                rows={2}
                placeholder="Short summary for social media and listings"
              />
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium mb-1">Featured Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  className="editor-input flex-1"
                  placeholder="https://..."
                />
                <label className="btn-secondary cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {uploadingImage && (
                <p className="text-sm text-gray-500 mt-1">Uploading...</p>
              )}
              {formData.featured_image && (
                <img
                  src={formData.featured_image}
                  alt="Featured"
                  className="mt-2 w-full max-w-md h-40 object-cover rounded-lg"
                />
              )}
            </div>

            {/* Content - Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Write your article here..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="btn-secondary"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              
              {userRole === 'dan' && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={saving}
                  className="btn-primary bg-amber-600 hover:bg-amber-700"
                >
                  <Send className="w-4 h-4" />
                  Submit for Review
                </button>
              )}
              
              {userRole === 'stephen' && editingDraft?.status === 'in_review' && (
                <button
                  onClick={handleApproveAndPublish}
                  disabled={publishing}
                  className="btn-primary"
                >
                  <Globe className="w-4 h-4" />
                  {publishing ? 'Publishing...' : 'Approve & Publish to WP'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Draft Card Component
function DraftCard({ 
  draft, 
  onEdit,
  onMarkBarryImported 
}: { 
  draft: Draft
  userRole: 'dan' | 'stephen'
  onEdit: (draft: Draft) => void
  onMarkBarryImported: (id: string) => void
}) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    in_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    published: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }

  return (
    <div className="editor-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-lg leading-tight">{draft.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[draft.status]}`}>
              {draft.status.replace('_', ' ')}
            </span>
            {(draft as any).section && (draft as any).section !== 'None' && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-dork-100 text-dork-700 dark:bg-dork-900/30 dark:text-dork-300">
                {(draft as any).section}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
            {draft.excerpt}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Slug: {draft.slug}</span>
            {draft.wordpress_post_id && (
              <span className="flex items-center gap-1 text-green-600">
                <Globe className="w-3 h-3" />
                WP #{draft.wordpress_post_id}
              </span>
            )}
            {draft.barry_imported && (
              <span className="flex items-center gap-1 text-blue-600">
                <Database className="w-3 h-3" />
                Barry
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(draft)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          {draft.status === 'approved' && !draft.barry_imported && (
            <button
              onClick={() => onMarkBarryImported(draft.id)}
              className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900/30 transition-colors"
              title="Mark as imported to Barry"
            >
              <Database className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
