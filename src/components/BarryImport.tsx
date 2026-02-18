import { useState, useEffect } from 'react'
import { supabase, type WordPressArticle } from '../lib/supabase'
import { telegramApi } from '../lib/telegram'
import { 
  Loader2, 
  CheckCircle, 
  Database, 
  ExternalLink,
  RefreshCw
} from 'lucide-react'

interface BarryImportProps {
  userRole: 'dan' | 'stephen'
}

export function BarryImport({ userRole: _userRole }: BarryImportProps) {
  const [articles, setArticles] = useState<WordPressArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [])

  async function fetchArticles() {
    try {
      const { data, error } = await supabase
        .from('wordpress_articles')
        .select('*')
        .eq('barry_imported', false)
        .order('published_at', { ascending: false })
      
      if (error) throw error
      setArticles(data || [])
    } catch (err) {
      console.error('Failed to fetch articles:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleImport(article: WordPressArticle) {
    setImporting(article.id)
    try {
      // Simulate Barry import - in production, this would call the Barry API
      // For now, we mark it as imported in Supabase
      
      const { error } = await supabase
        .from('wordpress_articles')
        .update({
          barry_imported: true,
          barry_imported_at: new Date().toISOString(),
        })
        .eq('id', article.id)

      if (error) throw error

      // Remove from list
      setArticles(articles.filter(a => a.id !== article.id))

      await telegramApi.sendNotification(
        'Article Imported to Barry',
        `"${article.title}" has been imported to Barry`,
        'low'
      )
    } catch (err) {
      alert('Failed to import article')
    } finally {
      setImporting(null)
    }
  }

  async function handleRefresh() {
    setLoading(true)
    await fetchArticles()
  }

  const pendingCount = articles.filter(a => !a.barry_imported).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Barry Import Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} articles pending import
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-input hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-dork-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-muted-foreground">No articles pending Barry import</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div 
              key={article.id} 
              className="p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{article.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{article.excerpt}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Published: {new Date(article.published_at).toLocaleDateString()}</span>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-dork-600 hover:underline"
                    >
                      View on site
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => handleImport(article)}
                  disabled={importing === article.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-dork-600 text-white hover:bg-dork-700 disabled:opacity-50"
                >
                  {importing === article.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Import to Barry
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
