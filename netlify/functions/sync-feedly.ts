import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''
const feedlyToken = process.env.FEEDLY_TOKEN || ''

const supabase = createClient(supabaseUrl, supabaseKey)

interface FeedlyItem {
  id: string
  title?: string
  alternate?: Array<{ href: string }>
  origin?: { title: string }
  summary?: { content: string }
  visual?: { url: string }
  published?: number
}

// Priority artists for flagging
const PRIORITY_ARTISTS = [
  'wolf alice', 'the 1975', 'wet leg', 'charli xcx', 'beabadoobee',
  'fontaines dc', 'idles', 'slowthai', 'yungblud', 'sam fender',
  'lorde', 'billie eilish', 'olivia rodrigo', 'arctic monkeys',
  'foals', 'bombay bicycle club', 'the strokes', 'yeah yeah yeahs'
]

// Section keywords
const UPSET_KEYWORDS = ['rock', 'punk', 'metal', 'hardcore', 'emo', 'post-hardcore']
const HYPE_KEYWORDS = ['debut', 'new artist', 'emerging', 'breakthrough']
const FESTIVAL_KEYWORDS = ['festival', 'lineup', 'stage', 'weekend']

function detectSection(title: string, summary: string, source: string): { section: string, isFestival: boolean } {
  const text = `${title} ${summary || ''} ${source}`.toLowerCase()
  
  if (FESTIVAL_KEYWORDS.some(kw => text.includes(kw))) {
    return { section: 'Festivals', isFestival: true }
  }
  if (UPSET_KEYWORDS.some(kw => text.includes(kw))) {
    return { section: 'Upset', isFestival: false }
  }
  if (HYPE_KEYWORDS.some(kw => text.includes(kw))) {
    return { section: 'Hype', isFestival: false }
  }
  return { section: 'None', isFestival: false }
}

function detectPriorityArtists(title: string, summary: string): string[] {
  const text = `${title} ${summary || ''}`.toLowerCase()
  return PRIORITY_ARTISTS.filter(artist => text.includes(artist)).map(a => a.title())
}

function extractArtistNames(title: string, summary: string): string[] {
  const text = `${title} ${summary || ''}`
  const patterns = [
    /^([A-Z][a-zA-Z\s]+?)(?:\s+(?:announce|release|drop|share|debut|unveil|return|sign|join|team|\-|\:|–))/,
    /([A-Z][a-zA-Z\s]+?)(?:\s+(?:and|\&|\+)\s+([A-Z][a-zA-Z\s]+?))?(?:\s+(?:announce|release|drop|share))/,
  ]
  
  const artists: string[] = []
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const name = match[1]?.trim()
      if (name && name.length > 2) artists.push(name)
    }
  }
  return [...new Set(artists)].slice(0, 3)
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Fetch from Feedly
    const response = await fetch(
      'https://cloud.feedly.com/v3/streams/contents?streamId=user/1592ec67-110b-42bc-bde5-b67a23c086f5/category/global.all&count=100&ranked=newest',
      {
        headers: {
          'Authorization': `OAuth ${feedlyToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Feedly API error: ${response.status}`)
    }

    const data = await response.json()
    const items: FeedlyItem[] = data.items || []
    
    let added = 0
    
    for (const item of items) {
      const title = item.title || 'Untitled'
      const url = item.alternate?.[0]?.href || ''
      const source = item.origin?.title || 'Unknown'
      const summary = item.summary?.content?.substring(0, 1000) || null
      const imageUrl = item.visual?.url && !item.visual.url.includes('blank') ? item.visual.url : null
      
      const publishedAt = item.published 
        ? new Date(item.published).toISOString()
        : new Date().toISOString()

      if (!url) continue

      // Detect metadata
      const { section, isFestival } = detectSection(title, summary || '', source)
      const priorityArtists = detectPriorityArtists(title, summary || '')
      const artistNames = extractArtistNames(title, summary || '')
      const priority = priorityArtists.length > 0

      // Insert to Supabase
      const { error } = await supabase
        .from('editorial_stories')
        .insert({
          title,
          url,
          source,
          summary,
          image_url: imageUrl,
          published_at: publishedAt,
          status: 'pending',
          priority,
          created_by: 'dan',
          section,
          is_festival: isFestival,
          artist_names: artistNames.length > 0 ? artistNames : null
        })

      if (error) {
        // URL conflict is expected for duplicates
        if (!error.message.includes('duplicate')) {
          console.error('Insert error:', error)
        }
      } else {
        added++
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ 
        success: true, 
        message: `Synced ${items.length} items, added ${added} new stories` 
      })
    }

  } catch (error) {
    console.error('Sync error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
