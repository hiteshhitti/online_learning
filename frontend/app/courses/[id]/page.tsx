'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Users, Award, PlayCircle, Share2, Heart,
  Loader2, CheckCircle2, Briefcase, CalendarDays, Timer,
  Monitor, MapPin, Wifi, Star, IndianRupee, ChevronRight, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { coursesApi, ApiCourse, batchesApi, ApiBatch } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const LEARN_BULLETS = [
  'Master core concepts with structured, hands-on curriculum',
  'Apply industry best practices through real-world projects',
  'Get job-ready with professional tools and workflows',
  'Build a portfolio that stands out to employers',
]

const ROLE_BULLETS = [
  'Junior / Mid-level Developer or Analyst',
  'Freelancer & Independent Consultant',
  'Project Lead / Team Coordinator',
  'Startup Founder with technical knowledge',
]

function BatchCard({
  batch,
  selected,
  onSelect,
}: {
  batch: ApiBatch
  selected: boolean
  onSelect: () => void
}) {
  const seatsLeft = batch.seats_total - batch.seats_filled
  const full = seatsLeft <= 0
  const modeIcon =
    batch.mode === 'Online' ? <Wifi className="w-3 h-3" /> :
    batch.mode === 'Offline' ? <MapPin className="w-3 h-3" /> :
    <Monitor className="w-3 h-3" />

  return (
    <button
      onClick={() => !full && onSelect()}
      disabled={full}
      className={`w-full text-left rounded-lg border-2 p-3 transition-all duration-150
        ${full ? 'opacity-50 cursor-not-allowed border-border bg-muted/30' :
          selected
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-border hover:border-primary/50 bg-card hover:bg-muted/20'
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="font-semibold text-xs text-foreground truncate">{batch.name}</p>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="w-3 h-3 flex-shrink-0" />
            <span>{new Date(batch.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Timer className="w-3 h-3 flex-shrink-0" />
            <span>{batch.timing}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium
              ${batch.mode === 'Online' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                batch.mode === 'Offline' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
              {modeIcon}{batch.mode}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium
              ${full ? 'bg-red-100 text-red-600' :
                seatsLeft <= 5 ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'}`}>
              {full ? 'Full' : `${seatsLeft} left`}
            </span>
          </div>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center
          ${selected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  )
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [batches, setBatches] = useState<ApiBatch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<ApiBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFavorited, setIsFavorited] = useState(false)
  const [batchError, setBatchError] = useState(false)

  useEffect(() => {
    coursesApi.get(courseId)
      .then(data => setCourse(data))
      .catch(() => setError('Course not found.'))
      .finally(() => setLoading(false))

    batchesApi.listByCourse(courseId)
      .then(data => setBatches(data.filter(b => b.is_active)))
      .catch(() => setBatches([]))
      .finally(() => setBatchesLoading(false))
  }, [courseId])

  const handleEnroll = () => {
    if (batches.length > 0 && !selectedBatch) {
      setBatchError(true)
      // Scroll to batches section
      document.getElementById('batches')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      toast.error('Please select a batch before enrolling')
      return
    }
    const url = selectedBatch
      ? `/checkout?courseId=${courseId}&batchId=${selectedBatch.id}`
      : `/checkout?courseId=${courseId}`
    router.push(url)
  }

  if (loading) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </main>
    )
  }

  if (error || !course) {
    return (
      <main className="min-h-screen pt-20 px-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <Link href="/courses" className="mt-4 inline-block">
            <Button>Back to Courses</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-20 bg-background">

      {/* ── Compact Hero ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary/8 via-background to-secondary/8 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <Link href="/courses" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />Back to Courses
          </Link>

          {/* Hero: 2-col — text left, small image right */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">

            {/* LEFT: meta — takes up most space */}
            <div className="flex-1 min-w-0 space-y-3">
              {course.category && (
                <span className="inline-block px-2.5 py-0.5 bg-primary/15 text-primary rounded-full text-[10px] font-semibold tracking-wide uppercase">
                  {course.category}
                </span>
              )}
              <h1 className="text-2xl lg:text-3xl font-extrabold leading-tight">{course.title}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{course.description}</p>

              {/* Quick stats — compact inline */}
              <div className="flex flex-wrap gap-3">
                {course.rating != null && course.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{course.rating}</span>
                    <span className="text-muted-foreground">rating</span>
                  </div>
                )}
                {course.students != null && course.students > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                )}
                {course.level && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Award className="w-3.5 h-3.5" />
                    <span>{course.level}</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{course.duration}</span>
                  </div>
                )}
              </div>

              {course.instructor && (
                <p className="text-xs text-muted-foreground">
                  Taught by <span className="font-medium text-foreground">{course.instructor}</span>
                </p>
              )}
            </div>

            {/* RIGHT: small course thumbnail — 220×140 max */}
            <div className="w-full lg:w-56 flex-shrink-0">
              <div className="rounded-xl overflow-hidden bg-muted flex items-center justify-center shadow-md"
                   style={{ aspectRatio: '16/10', maxHeight: '140px' }}>
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <PlayCircle className="w-10 h-10 text-primary/30" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── LEFT: main content ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* What you'll learn */}
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                What You&apos;ll Learn
              </h2>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {LEARN_BULLETS.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* About */}
            <section>
              <h2 className="text-lg font-bold mb-2">About this Course</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                This program is designed to take you from the fundamentals all the way to job-ready skills.
                Through a blend of live instruction, recorded sessions, and guided projects, you&apos;ll build
                real confidence and a strong portfolio.
              </p>
            </section>

            {/* Career roles */}
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Career Roles After This Course
              </h2>
              <div className="space-y-1.5">
                {ROLE_BULLETS.map((role, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-sm">{role}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Upcoming Batches ───────────────────────────────── */}
            <section id="batches">
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Upcoming Batches
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                You must select a batch to enroll. Each batch has a fixed schedule and limited seats.
              </p>

              {/* Error state if user tried to enroll without selecting */}
              {batchError && !selectedBatch && batches.length > 0 && (
                <div className="mb-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Please select a batch below before enrolling.</span>
                </div>
              )}

              {batchesLoading ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />Loading batches…
                </div>
              ) : batches.length === 0 ? (
                <Card className="p-5 text-center border-dashed">
                  <CalendarDays className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming batches right now.</p>
                  <p className="text-xs text-muted-foreground mt-1">Check back soon or enquire below.</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {batches.map(batch => (
                    <BatchCard
                      key={batch.id}
                      batch={batch}
                      selected={selectedBatch?.id === batch.id}
                      onSelect={() => { setSelectedBatch(batch); setBatchError(false) }}
                    />
                  ))}
                </div>
              )}

              {selectedBatch && (
                <div className="mt-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    <strong>{selectedBatch.name}</strong> selected — starting{' '}
                    {new Date(selectedBatch.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </section>

            {/* Instructor */}
            {course.instructor && (
              <section>
                <h2 className="text-lg font-bold mb-3">Instructor</h2>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                      {course.instructor.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{course.instructor}</h3>
                      <p className="text-xs text-muted-foreground">Course Instructor</p>
                    </div>
                  </div>
                </Card>
              </section>
            )}
          </div>

          {/* ── RIGHT: sticky sidebar ──────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-3">

              {/* Price & Enroll Card */}
              <Card className="p-5 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <div className="space-y-4">
                  {/* Price */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Course Fee</p>
                    <div className="flex items-baseline gap-0.5">
                      <IndianRupee className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-3xl font-extrabold text-primary">{course.price.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Inclusive of all taxes</p>
                  </div>

                  {/* Batch required notice */}
                  {batches.length > 0 && !selectedBatch && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <a href="#batches">Select a batch below to enroll</a>
                    </div>
                  )}

                  {/* Enroll button — always active, but validates batch on click */}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleEnroll}
                    variant={batches.length > 0 && !selectedBatch ? 'outline' : 'default'}
                  >
                    {batches.length > 0 && !selectedBatch ? 'Select Batch & Enroll' : 'Enroll Now →'}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => setIsFavorited(!isFavorited)}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                    {isFavorited ? 'Wishlisted' : 'Add to Wishlist'}
                  </Button>
                </div>
              </Card>

              {/* Quick info card */}
              <Card className="p-4 space-y-2.5">
                <p className="text-xs font-semibold">Course Details</p>
                {course.rating != null && course.rating > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-medium">⭐ {course.rating} / 5</span>
                  </div>
                )}
                {course.students != null && course.students > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Students</span>
                    <span className="font-medium">{course.students.toLocaleString()}</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                )}
                {course.level && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{course.level}</span>
                  </div>
                )}
                {batches.length > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Batches</span>
                    <span className="font-medium">{batches.length} upcoming</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <Button variant="outline" className="w-full gap-1.5 text-xs" size="sm" onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href)
                      toast.success('Link copied!')
                    }
                  }}>
                    <Share2 className="w-3 h-3" />
                    Share Course
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
