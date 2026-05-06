'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, PlayCircle, Award, Zap, Loader2, Users, BookOpen, Star, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CourseCard } from '@/components/course-card'
import { coursesApi, ApiCourse } from '@/lib/api'

const CATEGORIES = [
  'All',
  'AI & Machine Learning',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Cloud Computing',
  'Cyber Security',
  'UI/UX Design',
  'Graphic Design',
  'Digital Marketing',
  'DevOps',
  'Finance & Business',
  'Personal Development',
  'Other',
]

const COMPANIES = [
  { name: 'Igxact', logo: null, initials: 'IG' },
  { name: 'Pronota', logo: null, initials: 'P' },
  { name: 'MeritHub', logo: null, initials: 'MH' },
  { name: 'PixelCraft Infotech', logo: null, initials: 'PCI' },
]

const FEATURES = [
  { icon: Award, title: 'Expert Instructors', desc: 'Learn from industry professionals with years of real-world experience.' },
  { icon: Zap, title: 'Live + Recorded', desc: 'Attend live sessions or watch recordings at your own pace, anytime.' },
  { icon: CheckCircle, title: 'Industry Certificates', desc: 'Earn recognised certificates that boost your career and credibility.' },
  { icon: Users, title: '1:1 Mentorship', desc: "Get personalised guidance from mentors who've been in your shoes." },
]

export default function Home() {
  const [allCourses, setAllCourses] = useState<ApiCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    coursesApi.list()
      .then(data => setAllCourses(data))
      .catch(() => setAllCourses([]))
      .finally(() => setLoadingCourses(false))
  }, [])

  const filteredCourses = activeCategory === 'All'
    ? allCourses.slice(0, 6)
    : allCourses.filter(c => c.category?.toLowerCase() === activeCategory.toLowerCase()).slice(0, 6)

  return (
    <main className="min-h-screen bg-background font-sans">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0533] via-[#2d0a5e] to-[#1a0533] text-white pt-20 pb-16 px-4">
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block px-4 py-1.5 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-full text-sm font-medium tracking-wide">
                🚀 Now Enrolling — New Batches Starting Soon
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                Learn from <span className="text-orange-400">Industry Experts.</span>
                <br />Build Real Skills.
              </h1>
              <p className="text-lg text-purple-200 max-w-lg leading-relaxed">
                Master in-demand skills with live classes, hands-on projects, and 1:1 mentorship. Courses designed with top companies.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/courses">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2 px-6">
                    Explore Courses <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/enquiry">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-6">
                    Talk to Advisor
                  </Button>
                </Link>
              </div>
              {/* trust badges */}
              <div className="flex flex-wrap gap-6 pt-2">
                {[
                  { label: 'World-Class Instructors', icon: '🏆' },
                  { label: '1:1 Mentorship', icon: '🎯' },
                  { label: '3000+ Hiring Partners', icon: '🤝' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-2 text-sm text-purple-200">
                    <span>{b.icon}</span>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* right card */}
            <div className="hidden md:block">
              <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Live Class in Progress</p>
                    <p className="text-purple-300 text-xs">AI & Machine Learning Bootcamp</p>
                  </div>
                </div>
                <div className="h-40 bg-gradient-to-br from-purple-900/60 to-indigo-900/60 rounded-xl flex items-center justify-center border border-white/10">
                  <PlayCircle className="w-14 h-14 text-orange-400 opacity-80" />
                </div>
                <div className="mt-4 space-y-2">
                  {['Next Cohort: Starting Soon', '6 Month Program', 'Certificate Included'].map(t => (
                    <div key={t} className="flex items-center gap-2 text-sm text-purple-200">
                      <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
                <Link href="/courses">
                  <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 font-semibold">
                    View Program
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Collaborations ───────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">
            Programs in Collaboration with Top Companies & Universities
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {COMPANIES.map(company => (
              <div
                key={company.name}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:border-purple-300 hover:shadow-sm transition-all group"
              >
                <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-700 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 group-hover:scale-110 transition-transform">
                  {company.initials}
                </div>
                <span className="text-gray-700 font-semibold text-sm">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by Category + Featured Courses ────────────────────── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">

            {/* sidebar */}
            <aside className="md:w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-purple-700 to-indigo-600 px-4 py-3">
                  <p className="text-white font-bold text-sm uppercase tracking-wide">Browse Categories</p>
                </div>
                <ul className="divide-y divide-gray-100">
                  {CATEGORIES.map(cat => (
                    <li key={cat}>
                      <button
                        onClick={() => setActiveCategory(cat)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left ${
                          activeCategory === cat
                            ? 'bg-orange-50 text-orange-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                        <ChevronRight className={`w-4 h-4 ${activeCategory === cat ? 'text-orange-500' : 'text-gray-300'}`} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* courses */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
                  <p className="text-gray-500 text-sm mt-1">Start your learning journey today</p>
                </div>
                <Link href="/courses">
                  <Button variant="outline" size="sm" className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-50">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {loadingCourses ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCourses.map(course => (
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
                <Card className="p-12 text-center border-dashed">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">No courses available yet. Check back soon!</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Why Choose Us?</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Everything you need to go from beginner to job-ready professional.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group p-6 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all bg-white">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hiring Partners strip ─────────────────────────────────────── */}
      <section className="py-12 px-4 bg-gradient-to-r from-purple-700 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-purple-200 uppercase tracking-widest mb-1">Our Hiring Network</p>
              <h3 className="text-2xl font-bold">30+ Companies Hire Our Graduates</h3>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {['Google', 'Amazon', 'Microsoft', 'Infosys', 'TCS', 'Wipro'].map(c => (
                <span key={c} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-medium backdrop-blur">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Ready to Start Your <span className="text-purple-700">Learning Journey?</span>
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Browse our courses or talk to a career advisor to find the right program for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/courses">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2 px-8">
                Browse Courses <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/enquiry">
              <Button size="lg" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-8">
                Talk to Advisor
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
