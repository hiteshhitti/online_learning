'use client';

import { Star } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  avatar: string;
  course: string;
  rating: number;
  text: string;
}

export function TestimonialCard({ name, avatar, course, rating, text }: TestimonialCardProps) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border space-y-4">
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h4 className="font-bold text-foreground">{name}</h4>
          <p className="text-sm text-muted-foreground">{course}</p>
        </div>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
          />
        ))}
      </div>

      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}
