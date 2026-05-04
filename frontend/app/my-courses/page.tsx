'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { usersApi, coursesApi, ApiCourse } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface EnrolledCourse {
  id: string
  title: string
  category: string
  level: string
  image: string
  progress: number
  enrolledAt: string
}

export default function MyCoursesPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth()
  const router = useRouter()
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'progress' | 'completed' | 'wishlist'>('progress')

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/')
      return
    }
    if (!user) return

    Promise.all([
      usersApi.enrollments(user.id),
      coursesApi.list(),
    ])
      .then(([enrollmentData, apiCourses]) => {
        const mapped = enrollmentData.map(e => {
          const course = apiCourses.find((c: ApiCourse) => String(c.id) === String(e.course_id))
          return {
            id: e.course_id,
            title: course?.title || 'Unknown Course',
            category: course?.category || 'General',
            level: course?.level || 'Beginner',
            image: course?.image || '',
            progress: e.progress,
            enrolledAt: e.enrolled_at,
          }
        })
        setEnrolled(mapped)
      })
      .catch(() => {
        setEnrolled([])
      })
      .finally(() => setLoading(false))
  }, [user, isLoggedIn, authLoading, router])

  const inProgress = enrolled.filter(c => c.progress < 100)
  const completed = enrolled.filter(c => c.progress === 100)

  const displayCourses =
    activeTab === 'progress' ? inProgress :
    activeTab === 'completed' ? completed : []

  return (
    <main className="min-h-screen pt-24 pb-12">
      <section className="py-8 px-4 border-b border-border bg-card">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-1">Continue your learning journey</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {enrolled.length} course{enrolled.length !== 1 ? 's' : ''} enrolled
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          {(['progress', 'completed', 'wishlist'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 capitalize text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'progress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'progress' && inProgress.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {inProgress.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeTab === 'wishlist' ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">Your wishlist is empty</p>
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        ) : displayCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {displayCourses.map(course => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted overflow-hidden border-b border-border">
                  {course.image ? (
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-primary opacity-50" />
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg line-clamp-2">{course.title}</h3>
                      <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded whitespace-nowrap ml-2">
                        {course.level}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{course.category}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <Link href={`/learn/${course.id}`} className="block">
                    <Button className="w-full gap-2">
                      {course.progress === 100 ? 'View Certificate' : 'Continue Learning'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              {activeTab === 'completed'
                ? "You haven't completed any courses yet"
                : "You haven't enrolled in any courses yet"}
            </p>
            <Link href="/courses">
              <Button>Explore Courses</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
