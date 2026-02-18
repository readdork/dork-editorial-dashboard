import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Story = {
  id: string
  title: string
  url: string
  source: string
  summary: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export type Draft = {
  id: string
  story_id: string
  title: string
  slug: string
  excerpt: string
  content: string
  status: 'draft' | 'in_review' | 'approved'
  feedback: string
  created_at: string
}
