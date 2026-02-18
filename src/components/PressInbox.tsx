import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { telegramApi } from '../lib/telegram'
import { 
  Mail, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  Image,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface PressRelease {
  id: string
  email_id: string
  sender_email: string
  sender_name: string
  subject: string
  body_text: string
  attachments: Array<{ filename: string; cloudinary_url: string; mime_type: string }>
  external_links: {
    dropbox?: string[]
    google_drive?: string[]
    youtube?: string[]
    vimeo?: string[]
    wetransfer?: string[]
  }
  artist_names: string[]
  status: 'pending' | 'imported' | 'rejected'
  created_at: string
}

interface PressInboxProps {
  userRole: 'dan' | 'stephen'
}

export function PressInbox({ userRole: _userRole }: PressInboxProps) {
  const [releases, setReleases] = useState<PressRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRelease, setSelectedRelease] = useState<PressRelease | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchReleases()
  }, [])

  async function fetchReleases() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('editorial_press_releases')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setReleases(data || [])
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to load press releases:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(release: PressRelease) {
    try {
      // Create a story from the press release
      const { data: story, error: storyError } = await supabase
        .from('editorial_stories')
        .insert({
          title: release.subject,
          url: '#press-release',
          source: release.sender_name || release.sender_email,
          summary: release.body_text.substring(0, 500),
          status: 'approved',
          priority: true,
          artist_names: release.artist_names,
          created_by: 'dan',
        })
        .select()
        .single()
      
      if (storyError) throw storyError

      // Create a draft from the press release
      const { error: draftError } = await supabase
        .from('editorial_drafts')
        .insert({
          story_id: story.id,
          title: release.subject,
          slug: release.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60),
          excerpt: release.body_text.substring(0, 300),
          content: `<p>${release.body_text.replace(/\n\n/g, '</p><p>')}</p>`,
          featured_image: release.attachments[0]?.cloudinary_url || null,
          status: 'draft',
          created_by: 'dan',
        })

      if (draftError) throw draftError

      // Mark press release as imported
      await supabase
        .from('editorial_press_releases')
        .update({ 
          status: 'imported', 
          imported_to_story_id: story.id 
        })
        .eq('id', release.id)

      await telegramApi.sendNotification(
        'Press Release Approved & Draft Created',
        `"${release.subject}" from ${release.sender_name}\nDraft created with ${release.attachments.length} images`,
        'high'
      )

      setReleases(releases.map(r => 
        r.id === release.id ? { ...r, status: 'imported' } : r
      ))
      setSelectedRelease(null)
    } catch (err) {
      alert('Could not approve press release.')
    }
  }

  async function handleReject(releaseId: string) {
    try {
      await supabase
        .from('editorial_press_releases')
        .update({ status: 'rejected' })
        .eq('id', releaseId)
      
      setReleases(releases.map(r => 
        r.id === releaseId ? { ...r, status: 'rejected' } : r
      ))
    } catch (err) {
      alert('Could not reject.')
    }
  }

  const pendingCount = releases.filter(r => r.status === 'pending').length

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
          <h1 className="text-2xl font-bold">Press Inbox</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pendingCount} pending press releases
            <span className="ml-2 text-xs">(Refreshed: {lastRefresh.toLocaleTimeString()})</span>
          </p>
        </div>
        
        <button
          onClick={fetchReleases}
          disabled={loading}
          className="btn-secondary self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Releases List */}
      <div className="space-y-3">
        {releases.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No press releases found</p>
            <p className="text-sm mt-2">Emails are scanned automatically every 10 minutes</p>
          </div>
        ) : (
          releases.map((release) => (
            <PressReleaseCard
              key={release.id}
              release={release}
              onSelect={setSelectedRelease}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedRelease && (
        <PressReleaseDetail
          release={selectedRelease}
          onClose={() => setSelectedRelease(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}

function PressReleaseCard({ 
  release, 
  onSelect,
  onApprove,
  onReject 
}: { 
  release: PressRelease
  onSelect: (r: PressRelease) => void
  onApprove: (r: PressRelease) => void
  onReject: (id: string) => void
}) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    imported: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }

  const hasMedia = release.attachments.length > 0 || 
    Object.values(release.external_links).some(links => links && links.length > 0)

  return (
    <div 
      className={`editor-card hover:shadow-md transition-shadow cursor-pointer ${
        release.status === 'pending' ? 'border-l-4 border-l-amber-500' : ''
      }`}
      onClick={() => onSelect(release)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-base sm:text-lg leading-tight">{release.subject}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[release.status]}`}>
              {release.status}
            </span>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            From: {release.sender_name || release.sender_email}
          </p>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
            {release.body_text.substring(0, 200)}...
          </p>
          
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {release.artist_names?.map(artist => (
              <span key={artist} className="px-2 py-0.5 rounded-full bg-dork-100 text-dork-700 dark:bg-dork-900/30 dark:text-dork-300">
                {artist}
              </span>
            ))}
            
            {hasMedia && (
              <span className="flex items-center gap-1 text-blue-600">
                <Image className="w-3 h-3" />
                {release.attachments.length} images
                {Object.values(release.external_links).flat().length > 0 && (
                  <>, {Object.values(release.external_links).flat().length} links</>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {release.status === 'pending' && (
            <>
              <button
                onClick={() => onApprove(release)}
                className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                title="Approve & Create Draft"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onReject(release.id)}
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
  )
}

function PressReleaseDetail({ 
  release, 
  onClose,
  onApprove,
  onReject 
}: { 
  release: PressRelease
  onClose: () => void
  onApprove: (r: PressRelease) => void
  onReject: (id: string) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold">{release.subject}</h2>
              <p className="text-sm text-gray-500 mt-1">
                From: {release.sender_name} &lt;{release.sender_email}&gt;
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Attachments */}
          {release.attachments.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Attached Images ({release.attachments.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {release.attachments.map((att, i) => (
                  <a 
                    key={i}
                    href={att.cloudinary_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                  >
                    <img 
                      src={att.cloudinary_url} 
                      alt={att.filename}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {Object.entries(release.external_links).some(([_, links]) => links?.length > 0) && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">External Links</h3>
              <div className="space-y-1">
                {Object.entries(release.external_links).map(([type, links]) => 
                  links?.map((link: string, i: number) => (
                    <a
                      key={`${type}-${i}`}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {type}: {link.substring(0, 50)}...
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="prose dark:prose-invert max-w-none mb-6">
            <h3 className="text-sm font-medium mb-2">Content</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm whitespace-pre-wrap">
              {release.body_text}
            </div>
          </div>

          {/* Actions */}
          {release.status === 'pending' && (
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => onReject(release.id)}
                className="btn-secondary"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => onApprove(release)}
                className="btn-primary"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Create Draft
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
