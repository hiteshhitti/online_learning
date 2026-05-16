'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Search, ArrowUpRight, Clock, Flame, BookOpen,
  Briefcase, FlaskConical, GraduationCap, Cpu, RefreshCw, ArrowLeft
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Article {
  title:       string
  description: string
  url:         string
  image:       string | null
  publishedAt: string
  source:      { name: string }
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'All',         icon: Flame,          topic: 'technology' },
  { label: 'Technology',  icon: Cpu,            topic: 'technology' },
  { label: 'Business',    icon: Briefcase,      topic: 'business'   },
  { label: 'Science',     icon: FlaskConical,   topic: 'science'    },
  { label: 'Education',   icon: GraduationCap,  topic: 'education'  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h    = Math.floor(diff / 3_600_000)
  const d    = Math.floor(h / 24)
  if (h < 1)  return `${Math.floor(diff / 60000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
}

// ─── Hero Card (first article) ────────────────────────────────────────────────
function HeroCard({ article }: { article: Article }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      className="group relative flex flex-col justify-end overflow-hidden rounded-3xl min-h-[480px] sm:min-h-[520px] shadow-2xl">
      {/* Image */}
      {article.image ? (
        <img src={article.image} alt={article.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-indigo-900" />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      {/* Content */}
      <div className="relative p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-orange-500 text-white uppercase tracking-wide">
            <Flame className="w-3 h-3" /> Top Story
          </span>
          <span className="text-white/60 text-xs">{article.source.name}</span>
        </div>
        <h2 className="text-white text-2xl sm:text-3xl font-extrabold leading-tight mb-3 group-hover:text-orange-300 transition-colors">
          {article.title}
        </h2>
        {article.description && (
          <p className="text-white/70 text-sm leading-relaxed line-clamp-2 mb-4 max-w-2xl">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(article.publishedAt)}
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400 group-hover:text-orange-300 transition-colors">
            Read Full Story <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </a>
  )
}

// ─── Standard Card ────────────────────────────────────────────────────────────
function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-purple-200 hover:shadow-xl transition-all duration-300"
      style={{ animationDelay: `${index * 60}ms` }}>
      {/* Thumbnail */}
      <div className="relative overflow-hidden h-48 bg-gray-100 flex-shrink-0">
        {article.image ? (
          <img src={article.image} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-purple-300" />
          </div>
        )}
        {/* Source badge */}
        <div className="absolute top-3 left-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-purple-700 shadow-sm">
            {article.source.name}
          </span>
        </div>
      </div>
      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <Clock className="w-3 h-3" />
          <span>{formatDate(article.publishedAt)}</span>
          <span className="ml-auto text-purple-400 font-medium">{timeAgo(article.publishedAt)}</span>
        </div>
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors mb-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
            {article.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs font-bold text-orange-500 group-hover:text-orange-600 transition-colors mt-auto pt-3 border-t border-gray-100">
          Read More <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </a>
  )
}

// ─── Sidebar Card (compact) ───────────────────────────────────────────────────
function SidebarCard({ article }: { article: Article }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      className="group flex gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-100">
      {article.image && (
        <img src={article.image} alt=""
          className="w-20 h-16 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition-opacity" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-purple-600 mb-1 truncate">{article.source.name}</p>
        <h4 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors">
          {article.title}
        </h4>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />{timeAgo(article.publishedAt)}
        </p>
      </div>
    </a>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const [articles, setArticles]       = useState<Article[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeCategory, setActive]   = useState('All')
  const [activeTopic, setTopic]       = useState('technology')
  const [search, setSearch]           = useState('')
  const [refreshing, setRefreshing]   = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchNews = (topic: string, refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    fetch(`/api/news?topic=${topic}&max=20`)
      .then(r => r.json())
      .then(d => setArticles(d.articles || []))
      .catch(() => setArticles([]))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { fetchNews(activeTopic) }, [activeTopic])

  const filtered = articles.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  )

  const hero    = filtered[0]
  const main    = filtered.slice(1, 7)
  const sidebar = filtered.slice(7, 13)

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Back + breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="flex items-center gap-1 hover:text-purple-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Tech & Career Updates</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Live Feed
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                Tech & Career<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">
                  Updates
                </span>
              </h1>
              <p className="text-gray-500 mt-3 max-w-lg text-base leading-relaxed">
                Stay ahead with curated news on technology, careers, and education — updated every 30 minutes.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all placeholder:text-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mt-8 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(({ label, icon: Icon, topic }) => (
              <button key={label}
                onClick={() => { setActive(label); setTopic(topic); setSearch('') }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === label
                    ? 'bg-purple-700 text-white shadow-lg shadow-purple-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            <button onClick={() => fetchNews(activeTopic, true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap bg-white border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-all ml-auto">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-[480px] w-full" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <div className="p-5 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No articles found</h3>
            <p className="text-gray-400 text-sm">Try a different search term or category.</p>
            <button onClick={() => setSearch('')}
              className="mt-4 text-sm text-purple-600 hover:underline font-medium">
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-10">

            {/* Hero */}
            {hero && !search && <HeroCard article={hero} />}

            {/* Result count when searching */}
            {search && (
              <p className="text-sm text-gray-500">
                Found <span className="font-bold text-gray-800">{filtered.length}</span> articles for "{search}"
              </p>
            )}

            {/* Main grid + sidebar */}
            <div className="grid lg:grid-cols-3 gap-8">

              {/* Main articles grid */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-extrabold text-gray-900 text-xl">
                    {search ? 'Search Results' : 'Latest Stories'}
                  </h2>
                  <span className="text-xs text-gray-400">
                    {(search ? filtered : main).length} articles
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  {(search ? filtered : main).map((article, i) => (
                    <ArticleCard key={i} article={article} index={i} />
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              {!search && sidebar.length > 0 && (
                <aside>
                  <div className="sticky top-6">
                    <h2 className="font-extrabold text-gray-900 text-xl mb-5">More Stories</h2>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                      {sidebar.map((article, i) => (
                        <SidebarCard key={i} article={article} />
                      ))}
                    </div>
                  </div>
                </aside>
              )}
            </div>

            {/* Attribution */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                News sourced from GNews · All articles link to original publishers · Updated every 30 minutes
              </p>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}
