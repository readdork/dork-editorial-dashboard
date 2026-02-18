import axios from 'axios'

const WP_URL = import.meta.env.VITE_WORDPRESS_URL || ''
const WP_USER = import.meta.env.VITE_WORDPRESS_USER || ''
const WP_APP_PASSWORD = import.meta.env.VITE_WORDPRESS_APP_PASSWORD || ''

const authHeader = () => {
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
    const params: Record<string, string | number> = {
      per_page: perPage,
      _embed: 'wp:featuredmedia',
    }
    if (status) params.status = status
    
    const response = await axios.get(`${WP_URL}/wp-json/wp/v2/posts`, {
      headers: { Authorization: authHeader() },
      params,
    })
    return response.data
  },

  async createPost(post: {
    title: string
    content: string
    excerpt: string
    slug: string
    status: 'draft' | 'publish'
    featured_media?: number
  }): Promise<WordPressPost> {
    const response = await axios.post(`${WP_URL}/wp-json/wp/v2/posts`, post, {
      headers: { 
        Authorization: authHeader(),
        'Content-Type': 'application/json'
      },
    })
    return response.data
  },

  async updatePost(id: number, post: Partial<WordPressPost>): Promise<WordPressPost> {
    const response = await axios.post(`${WP_URL}/wp-json/wp/v2/posts/${id}`, post, {
      headers: { 
        Authorization: authHeader(),
        'Content-Type': 'application/json'
      },
    })
    return response.data
  },

  async uploadImage(file: File): Promise<number> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await axios.post(`${WP_URL}/wp-json/wp/v2/media`, formData, {
      headers: { 
        Authorization: authHeader(),
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
    })
    return response.data.id
  },
}
