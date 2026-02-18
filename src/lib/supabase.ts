import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Table names
export const STORIES_TABLE = 'editorial_stories'
export const DRAFTS_TABLE = 'editorial_drafts'

// Database types
export type Story = {
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
  story_id?: string
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
