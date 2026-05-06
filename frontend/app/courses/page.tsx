'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Loader2, X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CourseCard } from '@/components/course-card'
import { coursesApi, ApiCourse } from '@/lib/api'

const categories = ['All', 'AI & Machine Learning', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'Cyber Security', 'UI/UX Design', 'Graphic Design', 'Digital Marketing', 'DevOps', 'Finance & Business', 'Personal Development', 'Other']
const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced']

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All Levels')
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    coursesApi.list()
      .then(data => setCourses(data))
      .catch(() => setError('Could not connect to server.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || course.category?.toLowerCase() === selectedCategory.toLowerCase()
    const matchesLevel = selectedLevel === 'All Levels' || course.level === selectedLevel
    return matchesSearch && matchesCategory && matchesLevel
  })

  const hasActiveFilters = searchTerm || selectedCategory !== 'All' || selectedLevel !== 'All Levels'

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('All')
    setSelectedLevel('All Levels')
  }

  return (
    <main className="min-h-screen pt-20">
      {/* Compact header */}
      <section className="py-6 px-4 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-bold">Explore Courses</h1>
            <p className="text-sm text-muted-foreground">Discover courses by industry experts</p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-xs">
                <X className="w-3 h-3" /> Clear filters
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Sidebar Filters */}
          <aside className={`w-52 flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="space-y-5 sticky top-24">
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                </div>
                <div className="space-y-0.5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`block w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs ${
                        selectedCategory === cat
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Level</label>
                <div className="space-y-0.5">
                  {levels.map(level => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`block w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs ${
                        selectedLevel === level
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Courses Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-24">
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4">
                  {filtered.length} of {courses.length} courses
                  {hasActiveFilters && <span className="text-primary"> (filtered)</span>}
                </p>
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(course => (
                      <Link key={course.id} href={`/courses/${course.id}`}>
                        <CourseCard course={{
                          ...course,
                          instructor: { id: course.instructor || '', name: course.instructor || '', avatar: '', bio: '' },
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
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-sm">
                      {courses.length === 0 ? 'No courses added yet.' : 'No courses match your filters.'}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="link" size="sm" onClick={resetFilters} className="mt-2">
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
