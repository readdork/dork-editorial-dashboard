import { useState, useEffect } from 'react'
import { wordpressApi, type WordPressPost } from '../lib/wordpress'
import { supabase } from '../lib/supabase'
import { Loader2, RefreshCw, ExternalLink } from 'lucide-react'

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
      
      // Sync with Supabase for Barry tracking
      if (activeTab === 'published') {
        await syncPublishedPosts(wpPosts)
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">WordPress Integration</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-input hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'drafts'
              ? 'border-dork-600 text-dork-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Drafts
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'published'
              ? 'border-dork-600 text-dork-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Published
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-dork-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No {activeTab} posts found
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="p-4 rounded-lg border border-border bg-card hover:border-dork-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-medium truncate"
                    dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                  />
                  <p 
                    className="text-sm text-muted-foreground line-clamp-2 mt-1"
                    dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                  />
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <span className="capitalize">{post.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`${wpUrl}/wp-admin/post.php?post=${post.id}&action=edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md hover:bg-accent"
                    title="Edit in WordPress"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
