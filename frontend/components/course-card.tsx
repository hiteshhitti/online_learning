'use client';

import { Star, Users, Clock, BookOpen } from 'lucide-react';
import { Course } from '@/lib/data';

interface CourseCardProps {
  course: Course;
  showActions?: boolean;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

function resolveImage(image?: string): string | null {
  if (!image) return null
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  // bare filename or /uploads/filename — point to Render backend
  const filename = image.replace(/^\/uploads\//, '')
  return `${API_BASE}/uploads/${filename}`
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-500',
  Intermediate: 'bg-amber-500',
  Advanced: 'bg-rose-500',
};

export function CourseCard({ course }: CourseCardProps) {
  const levelColor = LEVEL_COLORS[course.level] ?? 'bg-primary';

  return (
    <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col">

      {/* Thumbnail — compact 130px */}
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex-shrink-0" style={{ height: '130px' }}>
        {resolveImage(course.image) ? (
          <img
            src={resolveImage(course.image)!}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary/30" />
          </div>
        )}

        {/* Level badge */}
        <span className={`absolute top-2 right-2 ${levelColor} text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider`}>
          {course.level}
        </span>

        {/* Category pill */}
        {course.category && (
          <span className="absolute bottom-2 left-2 bg-black/55 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[9px] font-medium">
            {course.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {course.title}
        </h3>

        {/* Instructor */}
        {course.instructor?.name && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
              {course.instructor.name.charAt(0)}
            </div>
            <span className="text-[11px] text-muted-foreground truncate leading-none">
              {course.instructor.name}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
          {course.rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-foreground">{course.rating}</span>
            </span>
          )}
          {course.students > 0 && (
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {course.students >= 1000 ? `${(course.students / 1000).toFixed(1)}k` : course.students}
            </span>
          )}
          {course.duration && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {course.duration}
            </span>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
          <p className="text-sm font-bold text-primary">₹{course.price.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-primary/70 font-medium group-hover:text-primary transition-colors">
            View →
          </span>
        </div>

      </div>
    </div>
  );
}
