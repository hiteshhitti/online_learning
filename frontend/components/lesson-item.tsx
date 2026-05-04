'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Lesson } from '@/lib/data';

interface LessonItemProps {
  lesson: Lesson;
  isActive?: boolean;
}

export function LessonItem({ lesson, isActive = false }: LessonItemProps) {
  const getTypeIcon = (type: string) => {
    const baseClasses = 'w-5 h-5';
    switch (type) {
      case 'video':
        return '▶️';
      case 'quiz':
        return '❓';
      case 'assignment':
        return '📝';
      default:
        return '📚';
    }
  };

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer ${
        isActive
          ? 'bg-primary/10 border border-primary'
          : 'hover:bg-muted border border-transparent'
      }`}
    >
      <div className="flex-shrink-0 pt-1">
        {lesson.completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p
              className={`font-medium text-sm line-clamp-1 ${
                isActive ? 'text-primary' : 'text-foreground'
              }`}
            >
              {getTypeIcon(lesson.type)} {lesson.title}
            </p>
          </div>
          <span className="flex-shrink-0 text-xs text-muted-foreground">
            {lesson.duration}m
          </span>
        </div>
      </div>
    </div>
  );
}
