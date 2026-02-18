import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types - mapped to existing feed_items schema
export type Story = {
  id: string
  title: string
  url: string  // mapped from 'link'
  source: string  // mapped from 'source_name'
  summary?: string  // mapped from 'excerpt'
  image_url?: string
  published_at: string  // mapped from 'pub_date'
  status: 'pending' | 'approved' | 'rejected'
  priority: boolean
  artist_name?: string
  created_at: string
}

export type Draft = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image?: string
  status: 'draft' | 'in_review' | 'approved' | 'published'
  created_at: string
  created_by: 'dan' | 'stephen'
}

// Helper to map database fields to app fields
export function mapStoryFromDB(item: any): Story {
  return {
    id: item.id,
    title: item.title,
    url: item.link || item.url || '',
    source: item.source_name || item.source || 'Unknown',
    summary: item.excerpt || item.summary,
    image_url: item.image_url,
    published_at: item.pub_date || item.published_at || item.created_at,
    status: item.status || 'pending',
    priority: item.priority || false,
    artist_name: item.artist_name,
    created_at: item.created_at
  }
}
