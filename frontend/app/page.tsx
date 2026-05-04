'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, PlayCircle, Award, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CourseCard } from '@/components/course-card'
import { coursesApi, ApiCourse, dashboardApi, DashboardStats } from '@/lib/api'
import { toast } from 'sonner'

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<ApiCourse[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    coursesApi.list()
      .then(data => setFeaturedCourses(data.slice(0, 3)))
      .catch(() => setFeaturedCourses([]))
      .finally(() => setLoadingCourses(false))

    dashboardApi.stats()
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 md:pt-32 md:pb-48">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="px-4 py-2 bg-secondary/20 text-secondary rounded-full text-sm font-medium inline-block">
                ✨ Welcome to LearnHub
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
                Learn from Industry Experts
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Master new skills with our comprehensive online courses. From web development to data science, we've got everything you need to succeed.
              </p>
              <div className="flex gap-4">
                <Link href="/courses">
                  <Button size="lg" className="gap-2">Explore Courses <ArrowRight className="w-4 h-4" /></Button>
                </Link>
                <Button variant="outline" size="lg" onClick={() => toast.info('Demo video coming soon! Browse our courses to get started.')}>
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-2xl opacity-30" />
                <div className="relative bg-card rounded-2xl p-8 border border-border shadow-xl">
                  <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-16 h-16 text-primary" />
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats from API */}
      {stats && (
        <section className="py-16 px-4 bg-card border-y border-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.users ?? '—'}</div>
                <p className="text-muted-foreground mt-2">Registered Students</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.courses ?? '—'}</div>
                <p className="text-muted-foreground mt-2">Courses Available</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.total_enrollments ?? '—'}</div>
                <p className="text-muted-foreground mt-2">Total Enrollments</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  {stats.total_revenue != null ? `₹${stats.total_revenue}` : '—'}
                </div>
                <p className="text-muted-foreground mt-2">Revenue Generated</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Featured Courses</h2>
          <p className="text-lg text-muted-foreground mb-12">Start your learning journey with our most popular courses</p>
          {loadingCourses ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredCourses.map(course => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <CourseCard course={{
                    ...course,
                    instructor: { id: course.instructor || '', name: course.instructor || 'Instructor', avatar: '', bio: '' },
                    image: course.image || '',
                    rating: course.rating ?? 0,
                    reviews: course.reviews ?? 0,
                    students: course.students ?? 0,
                    level: (course.level as 'Beginner' | 'Intermediate' | 'Advanced') ?? 'Beginner',
                    duration: course.duration ?? '',
                    lessons: 0,
                    updated: '',
                  }} />
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No courses available yet. Check back soon!</p>
            </Card>
          )}
          <div className="mt-12 text-center">
            <Link href="/courses">
              <Button variant="outline" size="lg" className="gap-2">View All Courses <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Why Choose LearnHub?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Award, title: 'Expert Instructors', desc: 'Learn from industry professionals with years of experience in their fields.' },
              { icon: Zap,   title: 'Interactive Learning', desc: 'Engage with hands-on projects, quizzes, and real-world assignments.' },
              { icon: CheckCircle, title: 'Certifications', desc: 'Earn recognized certificates upon course completion to boost your career.' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Start Learning?</h2>
            <p className="text-xl text-muted-foreground">Join our growing community of learners. Browse available courses today.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg" className="gap-2">Browse Courses <ArrowRight className="w-4 h-4" /></Button>
              </Link>
              <Link href="/enquiry">
                <Button size="lg" variant="outline">Send Enquiry</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </main>
  )
}
