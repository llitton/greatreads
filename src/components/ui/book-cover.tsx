'use client';

import { useState, useEffect } from 'react';

interface BookCoverProps {
  src?: string | null;
  resolvedSrc?: string | null;  // From BookCover.imageUrl (preferred)
  title: string;
  author?: string | null;
  bookId?: string;              // For on-demand resolution
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;           // For above-fold images
}

/**
 * Size presets (width x height in ~2:3 aspect ratio for book covers)
 */
const sizeClasses = {
  xs: { wrapper: 'w-8 h-12', text: 'text-[6px]', icon: 'w-4 h-4' },
  sm: { wrapper: 'w-10 h-[60px]', text: 'text-[7px]', icon: 'w-5 h-5' },
  md: { wrapper: 'w-12 h-[72px]', text: 'text-[8px]', icon: 'w-6 h-6' },
  lg: { wrapper: 'w-14 h-[84px]', text: 'text-[9px]', icon: 'w-7 h-7' },
  xl: { wrapper: 'w-20 h-[120px]', text: 'text-[10px]', icon: 'w-10 h-10' },
};

/**
 * Book silhouette SVG - a tasteful fallback
 */
function BookSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Book spine */}
      <rect
        x="2"
        y="2"
        width="20"
        height="28"
        rx="1"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
      {/* Spine detail */}
      <line
        x1="4"
        y1="2"
        x2="4"
        y2="30"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1"
      />
      {/* Page edges */}
      <line
        x1="7"
        y1="6"
        x2="18"
        y2="6"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="0.5"
      />
      <line
        x1="7"
        y1="9"
        x2="16"
        y2="9"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="0.5"
      />
      <line
        x1="7"
        y1="12"
        x2="17"
        y2="12"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="0.5"
      />
    </svg>
  );
}

/**
 * BookCover Component
 *
 * A resilient book cover that:
 * 1. Uses resolved CDN URL if available (preferred)
 * 2. Falls back to legacy coverUrl
 * 3. Shows tasteful book silhouette on failure (never initials)
 * 4. Optionally triggers background resolution
 *
 * Design principle: Initials are not allowed on key surfaces.
 * A silhouette is honest; initials look broken.
 */
export function BookCover({
  src,
  resolvedSrc,
  title,
  author,
  bookId,
  size = 'md',
  className = '',
  priority = false,
}: BookCoverProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Determine the best source to use
  useEffect(() => {
    // Priority: resolvedSrc > src
    if (resolvedSrc) {
      setImageSrc(resolvedSrc);
      setHasError(false);
    } else if (src) {
      setImageSrc(src);
      setHasError(false);
    } else {
      setImageSrc(null);
    }
  }, [resolvedSrc, src]);

  // If no image and we have a bookId, try to resolve
  useEffect(() => {
    if (!imageSrc && bookId && !isResolving && !hasError) {
      setIsResolving(true);

      // Attempt background resolution
      fetch(`/api/covers/resolve?bookId=${bookId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.imageUrl) {
            setImageSrc(data.imageUrl);
          }
        })
        .catch(() => {
          // Silent failure - we'll show silhouette
        })
        .finally(() => {
          setIsResolving(false);
        });
    }
  }, [imageSrc, bookId, isResolving, hasError]);

  const showPlaceholder = !imageSrc || hasError;

  if (showPlaceholder) {
    return (
      <div
        className={`${sizeClass.wrapper} rounded-lg bg-neutral-100 border border-neutral-200/50 flex flex-col items-center justify-center flex-shrink-0 ${className}`}
        title={`${title}${author ? ` by ${author}` : ''}`}
      >
        <BookSilhouette className={`${sizeClass.icon} text-neutral-400`} />
        {size !== 'xs' && size !== 'sm' && (
          <span className={`${sizeClass.text} text-neutral-400 mt-1 text-center px-1 leading-tight`}>
            Cover unavailable
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={`Cover of ${title}`}
      className={`${sizeClass.wrapper} object-cover rounded-lg shadow-sm flex-shrink-0 bg-neutral-100 ${className}`}
      onError={() => setHasError(true)}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}

/**
 * BookCoverWithFallback - same behavior, different name for backwards compatibility
 */
export function BookCoverWithFallback(props: BookCoverProps) {
  return <BookCover {...props} />;
}

/**
 * Hook to get the best cover URL for a book
 * Use this when you need programmatic access to cover URLs
 */
export function useCoverUrl(
  bookId: string | undefined,
  fallbackSrc?: string | null
): { src: string | null; isLoading: boolean } {
  const [src, setSrc] = useState<string | null>(fallbackSrc || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!bookId) return;

    setIsLoading(true);
    fetch(`/api/covers/resolve?bookId=${bookId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.imageUrl) {
          setSrc(data.imageUrl);
        }
      })
      .catch(() => {
        // Keep fallback
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [bookId]);

  return { src, isLoading };
}
