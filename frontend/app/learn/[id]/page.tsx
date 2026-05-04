'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Volume2, Settings, Maximize, Play, Pause, Loader2, Download } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { coursesApi, ApiCourse } from '@/lib/api'
import { toast } from 'sonner'

export default function VideoLearningPage() {
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  useEffect(() => {
    coursesApi.get(courseId)
      .then(data => setCourse(data))
      .catch(() => setCourse(null))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!course) {
    return (
      <main className="min-h-screen pt-24">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <Link href="/my-courses" className="mt-4 inline-block">
            <Button>Back to My Courses</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-16 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/my-courses`} className="inline-flex">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold truncate">{course.title}</h1>
            {course.instructor && (
              <p className="text-sm text-muted-foreground">by {course.instructor}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video */}
            <Card className="overflow-hidden bg-black aspect-video flex items-center justify-center relative group cursor-pointer">
              {course.image ? (
                <img src={course.image} alt={course.title} className="w-full h-full object-cover opacity-60" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white fill-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1 fill-white" />
                  )}
                </button>
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button className="w-10 h-10 bg-black/50 rounded hover:bg-black/70 flex items-center justify-center text-white">
                  <Volume2 className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 bg-black/50 rounded hover:bg-black/70 flex items-center justify-center text-white">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 bg-black/50 rounded hover:bg-black/70 flex items-center justify-center text-white">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </Card>

            {/* Lesson Info */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
              <p className="text-muted-foreground mb-6">{course.description}</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => toast.info('Resources will be available when the course is fully set up.')}>
                <Download className="w-4 h-4 mr-2" />Download Resources
              </Button>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">About this Course</h3>
              <p className="text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6 space-y-4">
                <h3 className="font-bold">Course Details</h3>
                {course.level && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Level</div>
                    <div className="font-bold">{course.level}</div>
                  </div>
                )}
                {course.duration && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Duration</div>
                    <div className="font-bold">{course.duration}</div>
                  </div>
                )}
                {course.instructor && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Instructor</div>
                    <div className="font-bold">{course.instructor}</div>
                  </div>
                )}
                <Link href={`/courses/${courseId}`} className="block">
                  <Button variant="outline" className="w-full">View Course Page</Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
