import { NextResponse } from 'next/server'

const NEWS_API_KEY = process.env.NEWS_API_KEY || ''

export async function GET() {
  if (!NEWS_API_KEY) {
    return NextResponse.json({ articles: [] })
  }
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=technology+india&language=en&sortBy=publishedAt&pageSize=8&apiKey=${NEWS_API_KEY}`,
      { next: { revalidate: 1800 } }
    )
    const data = await res.json()
    const articles = (data.articles || []).filter(
      (a: any) => a.title !== '[Removed]' && a.url !== 'https://removed.com'
    )
    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
