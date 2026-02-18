import { useState, useEffect } from 'react'
import { wordpressApi, type WordPressPost } from '../lib/wordpress'
import { supabase } from '../lib/supabase'
import { Loader2, RefreshCw, ExternalLink, Globe, FileText } from 'lucide-react'

interface WordPressManagerProps {
  userRole: 'dan' | 'stephen'
}

export function WordPressManager({ userRole: _userRole }: WordPressManagerProps) {
  const [posts, setPosts] = useState<WordPressPost[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState<'drafts' | 'published'>('drafts')

  useEffect(() => {
    fetchPosts()
  }, [activeTab])

  async function fetchPosts() {
    setLoading(true)
    try {
      const wpPosts = await wordpressApi.getPosts(activeTab, 20)
      setPosts(wpPosts)
      
      if (activeTab === 'published') {
        await syncPublishedPosts(wpPosts)
      }
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }

  async function syncPublishedPosts(wpPosts: WordPressPost[]) {
    try {
      for (const post of wpPosts) {
        const { data: existing } = await supabase
          .from('wordpress_articles')
          .select('id')
          .eq('wp_post_id', post.id)
          .single()

        if (!existing) {
          await supabase.from('wordpress_articles').insert([{
            wp_post_id: post.id,
            title: post.title.rendered,
            url: `${import.meta.env.VITE_WORDPRESS_URL}/${post.slug}`,
            excerpt: post.excerpt.rendered.replace(/<<[^\u003e]*>/g, ''),
            featured_image: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
            published_at: post.date,
            barry_imported: false,
          }])
        }
      }
    } catch (err) {
      console.error('Failed to sync posts:', err)
    }
  }

  async function handleSync() {
    setSyncing(true)
    await fetchPosts()
    setSyncing(false)
  }

  const wpUrl = import.meta.env.VITE_WORDPRESS_URL || ''

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">WordPress</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your published content
          </p>
        </div>
        
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-secondary self-start"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'drafts'
              ? 'bg-white dark:bg-gray-700 text-dork-600 dark:text-dork-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Drafts
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'published'
              ? 'bg-white dark:bg-gray-700 text-dork-600 dark:text-dork-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          Published
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-dork-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No {activeTab} posts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="editor-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-medium text-lg truncate"
                    dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                  />
                  <p 
                    className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1"
                    dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                  />
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <span className="capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                      {post.status}
                    </span>
                  </div>
                </div>

                <a
                  href={`${wpUrl}/wp-admin/post.php?post=${post.id}&action=edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Edit in WordPress"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
