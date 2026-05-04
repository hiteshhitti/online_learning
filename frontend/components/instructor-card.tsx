'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface InstructorCardProps {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}

export function InstructorCard({ id, name, avatar, bio }: InstructorCardProps) {
  return (
    <div className="bg-card p-5 rounded-xl border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground">{name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{bio}</p>
          <Link
            href={`/instructors/${id}`}
            className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-2 hover:gap-2 transition-all"
          >
            View Profile
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
