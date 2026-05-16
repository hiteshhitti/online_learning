import { NextResponse } from 'next/server'

const NEWS_API_KEY = process.env.NEWS_API_KEY || ''

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || 'technology'
  const max   = searchParams.get('max')   || '20'

  if (!NEWS_API_KEY) {
    return NextResponse.json({ articles: [] })
  }

  try {
    const res = await fetch(
      `https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=en&country=in&max=${max}&apikey=${NEWS_API_KEY}`,
      { next: { revalidate: 1800 } }
    )
    const data = await res.json()
    const articles = (data.articles || []).filter(
      (a: any) => a.title && a.url
    )
    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
