'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Users, BookOpen, TrendingUp, ArrowRight, Newspaper,
  Star, Clock, Zap, Award, ChevronRight, GraduationCap,
  BarChart2, Globe, Flame, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminApi, PublicStats } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string | null
  publishedAt: string
  source: { name: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { icon: Award,      value: '98%',   label: 'Placement Rate' },
  { icon: Star,       value: '4.9',   label: 'Avg Rating' },
  { icon: Globe,      value: '12+',   label: 'Cities Reached' },
  { icon: Flame,      value: '500+',  label: 'Batches Completed' },
]
const TESTIMONIALS = [
  { name: 'Arjun Sharma',   role: 'Software Engineer @ TCS',     text: 'The structured curriculum and live doubt sessions helped me crack my dream job within 3 months of completing the course.', rating: 5 },
  { name: 'Priya Kaur',     role: 'Data Analyst @ Infosys',      text: 'Best investment I made in my career. The instructors are industry professionals who teach real-world skills, not just theory.', rating: 5 },
  { name: 'Rohit Verma',    role: 'Full Stack Dev @ Startup',    text: 'Went from zero coding knowledge to building full-stack apps. The community support is what makes Ultimate Institute special.', rating: 5 },
]
const WHY_US = [
  { icon: Zap,           title: 'Live Interactive Classes',   desc: 'Real-time doubt solving with expert instructors — not pre-recorded videos.' },
  { icon: BarChart2,     title: 'Industry-Aligned Curriculum', desc: 'Syllabus designed with hiring managers to match what companies actually need.' },
  { icon: GraduationCap, title: 'Placement Support',          desc: 'Resume reviews, mock interviews, and direct referrals to our hiring partners.' },
  { icon: Users,         title: 'Peer Learning Community',    desc: 'Join cohorts of motivated learners and build your professional network.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-6 group hover:shadow-lg transition-all duration-300">
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 ${color}`} />
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} bg-opacity-15`}>
        <Icon className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
      </div>
      <p className="text-3xl font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-muted-foreground text-sm mt-1 font-medium">{label}</p>
    </div>
  )
}

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      className="group flex gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors">
      {article.urlToImage && (
        <img src={article.urlToImage} alt=""
          className="w-20 h-16 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition-opacity" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-primary font-semibold mb-1">{article.source.name}</p>
        <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />{timeAgo(article.publishedAt)}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 self-center" />
    </a>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PublicDashboardPage() {
  const [stats, setStats]         = useState<PublicStats | null>(null)
  const [news, setNews]           = useState<NewsArticle[]>([])
  const [newsLoading, setNL]      = useState(true)
  const [newsError, setNE]        = useState(false)
  const [statsLoading, setSL]     = useState(true)
  const [activeTestimonial, setAT] = useState(0)
  const tickerRef = useRef<HTMLDivElement>(null)

  // Load stats
  useEffect(() => {
    adminApi.publicStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setSL(false))
  }, [])

  // Load news via server-side proxy (avoids NewsAPI browser restriction)
  const fetchNews = () => {
    setNL(true); setNE(false)
    fetch("/api/news")
      .then(r => r.json())
      .then(d => { d.articles?.length ? setNews(d.articles) : setNE(true) })
      .catch(() => setNE(true))
      .finally(() => setNL(false))
  }

  useEffect(() => { fetchNews() }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setAT(p => (p + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const t = TESTIMONIALS[activeTestimonial]

  return (
    <>
      {/* ── SEO meta via next/head equivalent (inline for App Router) ── */}
      <main className="min-h-screen pb-20">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-28 pb-16 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--secondary)/0.06),transparent_60%)]" />
          <div className="max-w-6xl mx-auto relative">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              India's Fastest Growing Tech Institute
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight max-w-3xl">
              Build Skills That <span className="text-primary">Actually</span> Get You Hired
            </h1>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl leading-relaxed">
              Live classes, industry mentors, and guaranteed placement support — everything you need to launch your tech career at Ultimate Institute of Technologies.
            </p>
            <div className="flex gap-3 mt-8 flex-wrap">
              <Link href="/courses">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  Explore Courses <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/enquiry">
                <Button size="lg" variant="outline">Talk to a Counsellor</Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 space-y-16 py-14">

          {/* ── Live Stats ──────────────────────────────────────────────── */}
          <section aria-label="Institute statistics">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">By the Numbers</h2>
                <p className="text-muted-foreground text-sm mt-1">Real data, updated live</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
              </span>
            </div>
            {statsLoading ? (
              <div className="grid sm:grid-cols-3 gap-4">
                {[0,1,2].map(i => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : stats ? (
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard icon={Users}      value={stats.total_students}    label="Students Enrolled"   color="bg-primary" />
                <StatCard icon={BookOpen}   value={stats.total_courses}     label="Courses Available"   color="bg-blue-500" />
                <StatCard icon={TrendingUp} value={stats.total_enrollments} label="Total Enrollments"   color="bg-green-500" />
              </div>
            ) : null}
          </section>

          {/* ── Achievements ────────────────────────────────────────────── */}
          <section aria-label="Achievements" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center p-6 rounded-2xl border bg-card hover:border-primary/30 transition-colors">
                <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </section>

          {/* ── Courses + News ──────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-5 gap-8">

            {/* Courses (left, wider) */}
            {stats?.courses?.length ? (
              <section className="lg:col-span-3" aria-label="Available courses">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold">Courses Running Now</h2>
                  <Link href="/courses">
                    <Button variant="ghost" size="sm" className="gap-1 text-primary">
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {stats.courses.slice(0, 6).map(c => (
                    <Link key={c.id} href={`/courses/${c.id}`}>
                      <div className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">{c.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {c.instructor && <p className="text-xs text-muted-foreground">by {c.instructor}</p>}
                            {c.category && (
                              <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{c.category}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : <div className="lg:col-span-3" />}

            {/* News (right, narrower) */}
            <section className="lg:col-span-2" aria-label="Tech and education news">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-primary" />
                  <h2 className="text-xl font-bold">Tech News</h2>
                </div>
                <button onClick={fetchNews}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="rounded-2xl border bg-card overflow-hidden">
                {newsLoading ? (
                  <div className="space-y-3 p-3">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="flex gap-3">
                        <div className="w-20 h-16 rounded-lg bg-muted animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                          <div className="h-3 bg-muted animate-pulse rounded" />
                          <div className="h-3 bg-muted animate-pulse rounded w-4/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : newsError || news.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">News unavailable.</p>
                    <p className="text-xs mt-1">Add <code className="bg-muted px-1 rounded">NEWS_API_KEY</code> on Vercel to enable.</p>
                    <button onClick={fetchNews} className="mt-3 text-xs text-primary hover:underline">Retry</button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {news.slice(0, 6).map((a, i) => <NewsCard key={i} article={a} />)}
                  </div>
                )}
              </div>
              {!newsError && news.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Powered by NewsAPI · Updates every visit
                </p>
              )}
            </section>
          </div>

          {/* ── Why Us ──────────────────────────────────────────────────── */}
          <section aria-label="Why choose Ultimate Institute">
            <h2 className="text-2xl font-bold mb-2">Why Students Choose Us</h2>
            <p className="text-muted-foreground mb-8">We don't just teach — we transform careers.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {WHY_US.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-6 rounded-2xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all group">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Testimonials ────────────────────────────────────────────── */}
          <section aria-label="Student testimonials" className="rounded-3xl border bg-gradient-to-br from-primary/5 to-background p-8 sm:p-12">
            <div className="flex items-center gap-2 mb-8">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-bold">What Our Students Say</h2>
            </div>
            <div className="max-w-2xl">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-lg leading-relaxed font-medium mb-6 min-h-[80px] transition-all">
                "{t.text}"
              </blockquote>
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-primary">{t.role}</p>
              </div>
              <div className="flex gap-2 mt-6">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setAT(i)}
                    className={`h-1.5 rounded-full transition-all ${i === activeTestimonial ? 'w-8 bg-primary' : 'w-4 bg-muted-foreground/30'}`} />
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ─────────────────────────────────────────────────────── */}
          <section aria-label="Call to action"
            className="text-center rounded-3xl bg-primary p-12 text-primary-foreground shadow-xl shadow-primary/20">
            <h2 className="text-3xl font-bold mb-3">Start Your Tech Career Today</h2>
            <p className="opacity-80 mb-8 max-w-md mx-auto">
              Join thousands of students who transformed their careers with Ultimate Institute of Technologies.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/courses">
                <Button size="lg" variant="secondary" className="gap-2 font-semibold">
                  Browse Courses <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/enquiry">
                <Button size="lg" variant="outline"
                  className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Free Counselling
                </Button>
              </Link>
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
