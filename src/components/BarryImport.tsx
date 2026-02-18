import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { telegramApi } from '../lib/telegram'
import { 
  Loader2, 
  CheckCircle, 
  Database, 
  ExternalLink,
  RefreshCw,
  ArrowRight
} from 'lucide-react'

interface BarryImportProps {
  userRole: 'dan' | 'stephen'
}

export function BarryImport({ userRole: _userRole }: BarryImportProps) {
  const [articles, setArticles] = useState<any[]>([])
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
      console.error('Failed to load articles:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleImport(article: any) {
    setImporting(article.id)
    try {
      const { error } = await supabase
        .from('wordpress_articles')
        .update({
          barry_imported: true,
          barry_imported_at: new Date().toISOString(),
        })
        .eq('id', article.id)

      if (error) throw error

      setArticles(articles.filter(a => a.id !== article.id))

      await telegramApi.sendNotification(
        'Imported to Barry',
        `"${article.title}" is now in Barry`,
        'low'
      )
    } catch (err) {
      alert('Could not import. Try again.')
    } finally {
      setImporting(null)
    }
  }

  async function handleRefresh() {
    setLoading(true)
    await fetchArticles()
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Barry Import</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {articles.length} article{articles.length !== 1 ? 's' : ''} waiting to import
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn-secondary self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-dork-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium">All caught up</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">No articles waiting to import</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="editor-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg truncate">{article.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1"
                    dangerouslySetInnerHTML={{ __html: article.excerpt }}
                  />
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Published {new Date(article.published_at).toLocaleDateString()}
                    </span>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-dork-600 dark:text-dork-400 hover:underline flex items-center gap-1"
                    >
                      View on site
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => handleImport(article)}
                  disabled={importing === article.id}
                  className="btn-primary whitespace-nowrap"
                >
                  {importing === article.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Import
                      <ArrowRight className="w-4 h-4" />
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
