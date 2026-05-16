import { NextResponse } from 'next/server'

const NEWS_API_KEY = process.env.NEWS_API_KEY || ''

export async function GET() {
  if (!NEWS_API_KEY) {
    return NextResponse.json({ articles: [] })
  }
  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&country=in&pageSize=8&apiKey=${NEWS_API_KEY}`,
      { next: { revalidate: 1800 } } // cache 30 mins
    )
    const data = await res.json()
    return NextResponse.json({ articles: data.articles || [] })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
