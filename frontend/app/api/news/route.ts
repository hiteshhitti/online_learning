import { NextResponse } from 'next/server'

const NEWS_API_KEY = process.env.NEWS_API_KEY || ''

// GNews valid topics for top-headlines
const GNEWS_TOPICS = ['technology', 'business', 'science', 'education', 'health', 'world']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic  = searchParams.get('topic')  || 'technology'
  const query  = searchParams.get('q')      || ''
  const max    = searchParams.get('max')    || '20'

  if (!NEWS_API_KEY) {
    return NextResponse.json({ articles: [] })
  }

  try {
    let url: string

    if (query) {
      // Use search endpoint for specific queries (jobs, AI, startups etc.)
      url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=${max}&apikey=${NEWS_API_KEY}&sortby=publishedAt`
    } else if (GNEWS_TOPICS.includes(topic)) {
      // Use top-headlines for valid GNews topics
      url = `https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=en&country=in&max=${max}&apikey=${NEWS_API_KEY}`
    } else {
      // Fallback to search
      url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&country=in&max=${max}&apikey=${NEWS_API_KEY}&sortby=publishedAt`
    }

    const res = await fetch(url, { next: { revalidate: 1800 } })
    const data = await res.json()
    const articles = (data.articles || []).filter((a: any) => a.title && a.url)
    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
