import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { title, summary, source, url, artist_names } = JSON.parse(event.body || '{}')

    // Generate Dork-style title (sentence case, factual)
    const cleanTitle = title
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\.$/, '')

    // Generate slug
    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60)

    // Generate excerpt (1-2 sentences, no hype)
    const excerpt = summary 
      ? summary.substring(0, 150) + (summary.length > 150 ? '...' : '')
      : `${cleanTitle} - latest news from ${source}.`

    // Generate article content from feed item
    const content = generateFeedArticle(cleanTitle, summary, source, url, artist_names)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: cleanTitle,
        slug,
        excerpt,
        content,
      })
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate article',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

function generateFeedArticle(title: string, summary: string | null, source: string, url: string, artist_names: string[] | null): string {
  let article = ''
  
  // Opening paragraph with key info
  if (summary) {
    // Clean up the summary - remove promotional language
    let cleanSummary = summary
      .replace(/\b(hotly-?tipped|much-?anticipated|fast-?rising|award-?winning)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    article += `<p>${cleanSummary}</p>\n\n`
  } else {
    article += `<p>${title}.</p>\n\n`
  }
  
  // Context paragraph if we can extract more info
  const artist = artist_names?.[0] || title.split(/\s+(?:announce|release|drop|share)/i)[0]?.trim()
  if (artist) {
    article += `<p><strong>${artist}</strong> ${extractAnnouncement(title)}.</p>\n\n`
  }
  
  // Source attribution
  article += `<p>Via <a href="${url}" target="_blank" rel="noopener">${source}</a>.</p>`
  
  return article
}

function extractAnnouncement(title: string): string {
  // Extract the announcement part after the artist name
  const match = title.match(/^[^a-zA-Z]*([A-Z][a-zA-Z\s&]+?)\s+(announce|release|drop|share|debut|unveil|return)(?:s|es|ed)?\s*(.+)/i)
  if (match) {
    return `${match[2]}s ${match[3] || 'new music'}`
  }
  return 'has announced new music'
}
