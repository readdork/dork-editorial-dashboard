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
  Send,
  FileText,
  X,
  Save
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
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setDrafts(data || [])
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
      const slug = formData.slug || formData.title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      const draftData = {
        title: formData.title,
        slug,
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
          'Draft ready for review',
          `"${formData.title}" is waiting for your approval`,
          'medium'
        )
      }

      setShowEditor(false)
    } catch (err) {
      alert('Could not save draft. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublishToWordPress() {
    if (!editingDraft) return
    
    setPublishing(true)
    try {
      const wpPost = await wordpressApi.createPost({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        slug: formData.slug,
        status: 'draft',
      })

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
        'Published to WordPress',
        `"${formData.title}" is now in WordPress as a draft`,
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

  async function handleApprove(draftId: string) {
    try {
      const { error } = await supabase
        .from('drafts')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', draftId)
      
      if (error) throw error
      
      setDrafts(drafts.map(d => d.id === draftId ? { ...d, status: 'approved' } : d))
    } catch (err) {
      alert('Could not approve draft. Try again.')
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
        <h1 className="text-2xl font-bold">Draft Queue</h1>
        <button
          onClick={handleNew}
          className="btn-primary self-start"
        >
          <Plus className="w-4 h-4" />
          New draft
        </button>
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
                  onEdit={handleEdit}
                  userRole={userRole}
                  onApprove={handleApprove}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <div className="editor-card animate-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingDraft ? 'Edit draft' : 'New draft'}
            </h2>
            <button
              onClick={() => setShowEditor(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="editor-input"
                  placeholder="Article title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="editor-input"
                  placeholder="auto-generated-from-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Featured Image</label>
                <div className="flex items-center gap-3">
                  {formData.featured_image ? (
                    <img 
                      src={formData.featured_image} 
                      alt="Featured" 
                      className="h-12 w-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
                    >
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  
                  <label className="btn-secondary cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'Uploading...' : 'Upload image'}
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                className="editor-input"
                placeholder="Brief summary for social media and SEO"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={16}
                className="editor-textarea"
                placeholder="Write your article here..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="btn-secondary"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save draft'}
                </button>
              </div>

              <div className="flex gap-2">
                {userRole === 'dan' && editingDraft?.status !== 'approved' && (
                  <button
                    onClick={() => handleSave('in_review')}
                    disabled={saving}
                    className="btn-secondary"
                  >
                    <Eye className="w-4 h-4" />
                    Submit for review
                  </button>
                )}
                
                {userRole === 'stephen' && editingDraft && (
                  <button
                    onClick={handlePublishToWordPress}
                    disabled={publishing}
                    className="btn-primary"
                  >
                    <Send className="w-4 h-4" />
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
  const statusConfig = {
    draft: { label: 'Draft', class: 'status-draft' },
    in_review: { label: 'In Review', class: 'status-review' },
    approved: { label: 'Approved', class: 'status-approved' },
    published: { label: 'Published', class: 'status-approved' },
  }

  const status = statusConfig[draft.status]

  return (
    <div className="editor-card group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-lg truncate">{draft.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{draft.excerpt}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className={status.class}>{status.label}</span>
            {draft.wordpress_post_id && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                WP #{draft.wordpress_post_id}
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
          
          {userRole === 'stephen' && draft.status === 'in_review' && onApprove && (
            <button
              onClick={() => onApprove(draft.id)}
              className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
