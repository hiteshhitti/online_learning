'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, BookOpen, TrendingUp, Video, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { adminApi, PublicStats } from '@/lib/api'

export default function PublicDashboardPage() {
  const [stats, setStats]     = useState<PublicStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.publicStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <section className="py-10 px-4 border-b border-border bg-card">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold">Learning Community</h1>
          <p className="text-muted-foreground mt-2 text-lg">See what's happening on Ultimate Institute right now</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <>
            {/* Live Stats */}
            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="p-8 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <p className="text-4xl font-bold">{stats.total_students.toLocaleString()}</p>
                <p className="text-muted-foreground mt-2 font-medium">Students Enrolled</p>
              </Card>
              <Card className="p-8 text-center">
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-secondary" />
                </div>
                <p className="text-4xl font-bold">{stats.total_courses.toLocaleString()}</p>
                <p className="text-muted-foreground mt-2 font-medium">Courses Available</p>
              </Card>
              <Card className="p-8 text-center">
                <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-4xl font-bold">{stats.total_enrollments.toLocaleString()}</p>
                <p className="text-muted-foreground mt-2 font-medium">Total Enrollments</p>
              </Card>
            </div>

            {/* Running Courses */}
            {stats.courses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Courses Running Now</h2>
                  <Link href="/courses">
                    <Button variant="outline" className="gap-2">View All <ArrowRight className="w-4 h-4" /></Button>
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.courses.map(c => (
                    <Link key={c.id} href={`/courses/${c.id}`}>
                      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{c.title}</h3>
                            {c.instructor && <p className="text-xs text-muted-foreground mt-1">by {c.instructor}</p>}
                            {c.category  && (
                              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{c.category}</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Live Classes Teaser */}
            <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Live Classes</h3>
                  <p className="text-muted-foreground mt-1">Check our upcoming live sessions and register to get notified when they go live.</p>
                </div>
                <Link href="/live-classes" className="flex-shrink-0">
                  <Button className="gap-2">View Schedule <ArrowRight className="w-4 h-4" /></Button>
                </Link>
              </div>
            </Card>

            {/* CTA */}
            <div className="text-center py-8 space-y-4">
              <h2 className="text-3xl font-bold">Ready to join?</h2>
              <p className="text-muted-foreground text-lg">Browse our courses and start learning today.</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/courses"><Button size="lg" className="gap-2">Browse Courses <ArrowRight className="w-4 h-4" /></Button></Link>
                <Link href="/enquiry"><Button size="lg" variant="outline">Send Enquiry</Button></Link>
              </div>
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Could not load stats. Please try again later.</p>
          </Card>
        )}
      </div>
    </main>
  )
}
