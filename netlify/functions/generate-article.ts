import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

// This would integrate with OpenAI or similar to generate Dork-style articles
// For now, return a structured template

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { subject, body, artist_names, sender } = JSON.parse(event.body || '{}')

    // Extract key info from the PR
    const artist = artist_names?.[0] || subject.split(/\s+(?:announce|release|drop|share)/i)[0]?.trim() || 'Artist'
    
    // Generate Dork-style title (sentence case, factual)
    const title = subject
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\.$/, '') // Remove trailing period

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60)

    // Generate excerpt (1-2 sentences, no hype)
    const firstSentence = body.split(/[.!?]/)[0]?.trim() || ''
    const excerpt = firstSentence.length > 100 
      ? firstSentence.substring(0, 150) + '...'
      : firstSentence + '.'

    // Generate article structure
    const content = generateArticleContent(artist, body, sender)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        slug,
        excerpt,
        content,
        artist,
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

function generateArticleContent(artist: string, body: string, sender: string): string {
  // Parse the PR body for key information
  const lines = body.split('\n').filter(l => l.trim())
  
  // Find quotes (lines with quotation marks)
  const quotes = lines.filter(l => l.includes('"') && l.length > 20)
  
  // Find dates/tour info
  const tourLines = lines.filter(l => 
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(l) &&
    /\d{1,2}/.test(l)
  )
  
  // Build article
  let article = ''
  
  // Opening paragraph - key info only
  article += `<p><strong>${artist}</strong> ${extractAnnouncement(body)}</p>\n\n`
  
  // Context/background paragraph
  const context = extractContext(body)
  if (context) {
    article += `<p>${context}</p>\n\n`
  }
  
  // Quote if available
  if (quotes.length > 0) {
    const quote = quotes[0].replace(/^[^"]*"|"[^"]*$/g, '').trim()
    article += `<blockquote>\n<p>'${quote}'</p>\n</blockquote>\n\n`
  }
  
  // Tour dates if available
  if (tourLines.length > 0) {
    article += `<p><strong>Live dates</strong></p>\n`
    article += `<p>${tourLines.slice(0, 5).join('<br/>')}</p>\n\n`
  }
  
  // Release info
  const releaseInfo = extractReleaseInfo(body)
  if (releaseInfo) {
    article += `<p>${releaseInfo}</p>`
  }
  
  return article
}

function extractAnnouncement(body: string): string {
  // Extract the main announcement from first paragraph
  const firstPara = body.split('\n\n')[0] || body
  // Remove artist name if at start
  return firstPara.replace(/^[^a-zA-Z]*/, '').trim()
}

function extractContext(body: string): string | null {
  // Look for background/context info (usually after first paragraph)
  const paragraphs = body.split('\n\n')
  if (paragraphs.length > 1) {
    const context = paragraphs[1].trim()
    if (context.length > 50 && !context.includes('"')) {
      return context
    }
  }
  return null
}

function extractReleaseInfo(body: string): string | null {
  // Look for release date info
  const releaseMatch = body.match(/(?:out|released?|available)\s+(?:now|on|this)?\s*([A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)?)/i)
  if (releaseMatch) {
    return `The release is out ${releaseMatch[1]}.`
  }
  return null
}
