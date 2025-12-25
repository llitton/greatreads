'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';

interface FeedCardProps {
  event: {
    id: string;
    friendName: string;
    eventDate: string | null;
    reviewText: string | null;
    eventUrl: string | null;
    book: {
      id: string;
      title: string;
      author: string | null;
      coverUrl: string | null;
      goodreadsBookUrl: string | null;
    };
    userStatus: 'WANT_TO_READ' | 'READING' | 'READ' | null;
  };
  onUpdateStatus: (bookId: string, status: 'WANT_TO_READ' | 'READ') => Promise<void>;
}

export function FeedCard({ event, onUpdateStatus }: FeedCardProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(event.userStatus);

  const handleStatusUpdate = async (status: 'WANT_TO_READ' | 'READ') => {
    setLoading(true);
    try {
      await onUpdateStatus(event.book.id, status);
      setCurrentStatus(status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="card p-5 animate-fadeIn">
      <div className="flex gap-4">
        {/* Book cover */}
        <div className="flex-shrink-0">
          {event.book.coverUrl ? (
            <img
              src={event.book.coverUrl}
              alt={`Cover of ${event.book.title}`}
              className="w-20 h-28 object-cover rounded shadow-sm"
            />
          ) : (
            <div className="w-20 h-28 bg-[var(--color-parchment)] rounded flex items-center justify-center">
              <span className="text-3xl">📕</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg font-serif font-bold text-[var(--color-brown-dark)] leading-tight">
                {event.book.title}
              </h3>
              {event.book.author && (
                <p className="text-sm text-[var(--color-brown)]">by {event.book.author}</p>
              )}
            </div>
            <StarRating value={5} readonly size="sm" />
          </div>

          {/* Friend info */}
          <p className="text-sm text-[var(--color-brown-light)] mb-2">
            <span className="font-medium text-[var(--color-brown)]">{event.friendName}</span> gave
            this 5 stars
            {event.eventDate && (
              <> · {formatDistanceToNow(new Date(event.eventDate), { addSuffix: true })}</>
            )}
          </p>

          {/* Review snippet */}
          {event.reviewText && (
            <p className="text-sm text-[var(--color-brown)] line-clamp-2 mb-3 italic">
              &ldquo;{event.reviewText}&rdquo;
            </p>
          )}

          {/* Status badge */}
          {currentStatus && (
            <div className="mb-3">
              <span
                className={`badge ${currentStatus === 'READ' ? 'badge-success' : 'badge-warning'}`}
              >
                {currentStatus === 'READ'
                  ? '✓ Read'
                  : currentStatus === 'READING'
                    ? '📖 Reading'
                    : '📌 Want to Read'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
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
                className="btn btn-ghost text-xs"
              >
                View on Goodreads →
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
