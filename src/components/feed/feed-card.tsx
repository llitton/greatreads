'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { BookCoverWithFallback } from '@/components/ui/book-cover';
import { BookStatusBadge } from '@/components/ui/status-pill';
import { SignalPill, createSignal } from '@/components/ui/signal-attribution';
import { normalizeGoodreadsText } from '@/lib/text/normalize';
import type { SignalType } from '@/lib/signals/types';

interface FeedCardProps {
  event: {
    id: string;
    friendName: string;
    friendId?: string; // Source person ID for signal attribution
    eventDate: string | null;
    reviewText: string | null;
    eventUrl: string | null;
    rating?: number; // 4 or 5, depending on why it's shown
    signalType?: SignalType; // Type of signal (five_star, top_10, etc.)
    book: {
      id: string;
      title: string;
      author: string | null;
      coverUrl: string | null;
      goodreadsBookUrl: string | null;
    };
    userStatus: 'WANT_TO_READ' | 'READING' | 'READ' | null;
  };
  viewerId?: string; // Current viewer's ID for "You" substitution
  onUpdateStatus: (bookId: string, status: 'WANT_TO_READ' | 'READ') => Promise<void>;
}

export function FeedCard({ event, viewerId, onUpdateStatus }: FeedCardProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(event.userStatus);

  // Create signal for attribution
  const signal = createSignal({
    type: event.signalType || 'five_star',
    sourcePersonId: event.friendId || event.id, // Use friendId if available, fallback to event id
    sourcePersonName: event.friendName,
    sourceKind: 'rss',
    rating: event.rating || 5,
  });

  const handleStatusUpdate = async (status: 'WANT_TO_READ' | 'READ') => {
    setLoading(true);
    try {
      await onUpdateStatus(event.book.id, status);
      setCurrentStatus(status);
    } finally {
      setLoading(false);
    }
  };

  // Determine the rating to display (default to 5)
  const rating = event.rating || 5;

  return (
    <article className="bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow animate-fadeIn overflow-hidden">
      {/* Book spine accent */}
      <div className="flex">
        <div className="w-1.5 bg-gradient-to-b from-[#d4a855] to-[#c49845] flex-shrink-0" />

        <div className="flex-1 p-6">
          <div className="flex gap-5">
            {/* Book cover */}
            <BookCoverWithFallback
              src={event.book.coverUrl}
              title={event.book.title}
              size="lg"
              className="shadow-md"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header with title and stars */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <h3 className="text-lg font-serif font-bold text-[#1f1a17] leading-tight">
                    {event.book.title}
                  </h3>
                  {event.book.author && (
                    <p className="text-[15px] text-[#5b4a3f] mt-1">by {event.book.author}</p>
                  )}
                </div>
                {/* Stars based on actual rating */}
                <div className="flex-shrink-0 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${star <= rating ? 'text-[#d4a855]' : 'text-neutral-200'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {/* Signal attribution - source person, not viewer */}
              <div className="flex items-center gap-2 mt-3 mb-3">
                <SignalPill signal={signal} viewerId={viewerId} />
                {event.eventDate && (
                  <span className="text-xs text-neutral-400">
                    {formatDistanceToNow(new Date(event.eventDate), { addSuffix: true })}
                  </span>
                )}
              </div>

              {/* Review snippet */}
              {event.reviewText && normalizeGoodreadsText(event.reviewText) && (
                <p className="text-[15px] leading-relaxed text-neutral-600 line-clamp-2 mb-4 italic bg-neutral-50 rounded-xl px-4 py-3 border-l-2 border-[#d4a855]">
                  &ldquo;{normalizeGoodreadsText(event.reviewText)}&rdquo;
                </p>
              )}

              {/* Status badge */}
              {currentStatus && (
                <div className="mb-4">
                  <BookStatusBadge status={currentStatus} />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                {currentStatus !== 'WANT_TO_READ' && currentStatus !== 'READ' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusUpdate('WANT_TO_READ')}
                    loading={loading}
                  >
                    Want to Read
                  </Button>
                )}
                {currentStatus !== 'READ' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusUpdate('READ')}
                    loading={loading}
                  >
                    Mark as Read
                  </Button>
                )}
                {event.book.goodreadsBookUrl && (
                  <a
                    href={event.book.goodreadsBookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#8b7355] hover:text-[#5b4a3f] transition-colors ml-auto"
                  >
                    View on Goodreads →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
