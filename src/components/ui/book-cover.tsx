'use client';

import { useState } from 'react';

interface BookCoverProps {
  src?: string | null;
  title: string;
  author?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Size presets (width x height in ~2:3 aspect ratio for book covers)
 */
const sizeClasses = {
  xs: { wrapper: 'w-8 h-12', text: 'text-[8px]' },
  sm: { wrapper: 'w-10 h-[60px]', text: 'text-[10px]' },
  md: { wrapper: 'w-12 h-[72px]', text: 'text-xs' },
  lg: { wrapper: 'w-14 h-[84px]', text: 'text-xs' },
  xl: { wrapper: 'w-20 h-[120px]', text: 'text-sm' },
};

/**
 * Generate initials from title for placeholder
 */
function getInitials(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.substring(0, 2).toUpperCase() || '?';
}

/**
 * Generate a consistent color based on title
 */
function getPlaceholderColor(title: string): string {
  const colors = [
    'from-amber-100 to-amber-200 text-amber-700',
    'from-emerald-100 to-emerald-200 text-emerald-700',
    'from-sky-100 to-sky-200 text-sky-700',
    'from-violet-100 to-violet-200 text-violet-700',
    'from-rose-100 to-rose-200 text-rose-700',
    'from-orange-100 to-orange-200 text-orange-700',
    'from-teal-100 to-teal-200 text-teal-700',
    'from-stone-100 to-stone-200 text-stone-600',
  ];

  // Simple hash based on title
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * BookCover Component
 *
 * A resilient book cover image that:
 * 1. Shows a styled placeholder when src is missing/null
 * 2. Falls back to placeholder on load error (503, 404, etc.)
 * 3. Never shows the broken image icon
 *
 * Archive.org and other cover CDNs are unreliable - this component
 * ensures the UI always looks good regardless of external failures.
 */
export function BookCover({
  src,
  title,
  author,
  size = 'md',
  className = '',
}: BookCoverProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const showPlaceholder = !src || hasError;

  const initials = getInitials(title);
  const colorClass = getPlaceholderColor(title);

  if (showPlaceholder) {
    return (
      <div
        className={`${sizeClass.wrapper} rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0 shadow-sm ${className}`}
        title={title}
      >
        <span className={`font-medium tracking-wide ${sizeClass.text}`}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Cover of ${title}`}
      className={`${sizeClass.wrapper} object-cover rounded-lg shadow-sm flex-shrink-0 ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}

/**
 * BookCoverWithFallback - same behavior, different name for backwards compatibility
 */
export function BookCoverWithFallback(props: BookCoverProps) {
  return <BookCover {...props} />;
}
