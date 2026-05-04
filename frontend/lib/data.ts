// These types are used by components that expect the full Course shape.
// Actual data is fetched from the API; these static arrays remain empty
// but the types must be declared so TypeScript compiles cleanly.

export interface Instructor {
  id: string
  name: string
  avatar: string
  bio: string
}

export interface Course {
  id: string
  title: string
  description: string
  price: number
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  instructor: Instructor
  duration: string
  students: number
  rating: number
  reviews: number
  image: string
  lessons: number
  updated: string
}

export interface UserCourse {
  id: string
  courseId: string
  progress: number
  enrolledAt: string
}

export interface Lesson {
  id: string
  courseId: string
  title: string
  description: string
  duration: string
  videoUrl?: string
}

export const courses: Course[] = []
export const userCourses: UserCourse[] = []
export const lessons: Lesson[] = []
export const instructors: Instructor[] = []
export const testimonials: { id: string; name: string; avatar: string; course: string; rating: number; text: string }[] = []
