'use client';

interface BookCoverProps {
  src?: string | null;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-[72px]',
  md: 'w-14 h-20',
  lg: 'w-20 h-28',
};

/**
 * Consistent book cover with fallback
 * Shows initials from title when no cover URL is available
 */
export function BookCover({ src, title, size = 'md', className = '' }: BookCoverProps) {
  const sizeClass = sizeClasses[size];

  // Get initials from first two words of title
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();

  if (!src) {
    return (
      <div
        className={`${sizeClass} rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center flex-shrink-0 shadow-sm ${className}`}
      >
        <span className="text-stone-500 text-xs font-medium tracking-wide">
          {initials || '📕'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Cover of ${title}`}
      className={`${sizeClass} object-cover rounded-lg shadow-sm flex-shrink-0 ${className}`}
      onError={(e) => {
        // On error, replace with fallback
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = target.nextElementSibling;
        if (fallback) {
          fallback.classList.remove('hidden');
        }
      }}
    />
  );
}

/**
 * Book cover with hidden fallback that appears on image load error
 * Use this when you need the fallback to be a sibling element
 */
export function BookCoverWithFallback({ src, title, size = 'md', className = '' }: BookCoverProps) {
  const sizeClass = sizeClasses[size];

  const initials = title
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <div className={`${sizeClass} flex-shrink-0 ${className}`}>
      {src ? (
        <>
          <img
            src={src}
            alt={`Cover of ${title}`}
            className={`${sizeClass} object-cover rounded-lg shadow-sm`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div
            className={`hidden ${sizeClass} rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center shadow-sm`}
          >
            <span className="text-stone-500 text-xs font-medium tracking-wide">
              {initials || '📕'}
            </span>
          </div>
        </>
      ) : (
        <div
          className={`${sizeClass} rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center shadow-sm`}
        >
          <span className="text-stone-500 text-xs font-medium tracking-wide">
            {initials || '📕'}
          </span>
        </div>
      )}
    </div>
  );
}
