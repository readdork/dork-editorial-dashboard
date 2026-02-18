// WordPress API service - matching barrynew2 approach

const WP_URL = import.meta.env.VITE_WORDPRESS_URL || ''
const WP_USER = import.meta.env.VITE_WORDPRESS_USER || ''
const WP_APP_PASSWORD = import.meta.env.VITE_WORDPRESS_APP_PASSWORD || ''

// Ensure URL ends with /wp-json
const getApiUrl = (url: string): string => {
  const trimmed = url.trim()
  if (!trimmed.endsWith('/wp-json')) {
    return trimmed + '/wp-json'
  }
  return trimmed
}

const API_URL = getApiUrl(WP_URL)

const getAuthHeader = (): string => {
  const token = btoa(`${WP_USER}:${WP_APP_PASSWORD}`)
  return `Basic ${token}`
}

export type WordPressPost = {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  slug: string
  status: 'draft' | 'publish' | 'future' | 'pending' | 'private'
  date: string
  featured_media: number
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
    }>
  }
}

export const wordpressApi = {
  async getPosts(status?: string, perPage = 20): Promise<WordPressPost[]> {
    const params = new URLSearchParams()
    params.append('per_page', perPage.toString())
    params.append('_embed', 'wp:featuredmedia')
    if (status) params.append('status', status)
    
    const response = await fetch(`${API_URL}/wp/v2/posts?${params.toString()}`, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }
    
    return response.json()
  },

  async createPost(post: {
    title: string
    content: string
    excerpt: string
    slug: string
    status: 'draft' | 'publish'
    featured_media?: number
    author?: number
  }): Promise<WordPressPost> {
    const response = await fetch(`${API_URL}/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...post,
        categories: [1] // News category
      })
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }
    
    return response.json()
  },

  async updatePost(id: number, post: Partial<WordPressPost>): Promise<WordPressPost> {
    const response = await fetch(`${API_URL}/wp/v2/posts/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(post)
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }
    
    return response.json()
  },

  async uploadImage(file: File): Promise<number> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_URL}/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader()
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }
    
    const data = await response.json()
    return data.id
  }
}
