import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// For server-side operations, use the Netlify Function proxy
export const supabaseServer = {
  async query(table: string, query: string = '') {
    const response = await fetch(`/.netlify/functions/supabase/${table}${query}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },
  
  async insert(table: string, data: any) {
    const response = await fetch(`/.netlify/functions/supabase/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },
  
  async update(table: string, id: string, data: any) {
    const response = await fetch(`/.netlify/functions/supabase/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
}

// Database types
export type FeedItem = {
  id: string
  title: string
  url: string
  source: string
  summary?: string
  image_url?: string
  published_at: string
  status: 'pending' | 'approved' | 'rejected'
  priority: boolean
  artist_name?: string
  created_at: string
  updated_at: string
  created_by: 'dan' | 'stephen'
}

export type Draft = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image?: string
  status: 'draft' | 'in_review' | 'approved' | 'published'
  wordpress_post_id?: number
  wordpress_status?: 'draft' | 'publish'
  barry_imported: boolean
  created_at: string
  updated_at: string
  created_by: 'dan' | 'stephen'
  published_at?: string
}

export type WordPressArticle = {
  id: string
  wp_post_id: number
  title: string
  url: string
  excerpt: string
  featured_image?: string
  published_at: string
  barry_imported: boolean
  barry_imported_at?: string
  created_at: string
}
