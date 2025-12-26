'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
    <article className="bg-white rounded-xl border border-[var(--color-tan)] p-5 shadow-sm hover:shadow-md transition-shadow animate-fadeIn">
      <div className="flex gap-4">
        {/* Book cover */}
        <div className="flex-shrink-0">
          {event.book.coverUrl ? (
            <img
              src={event.book.coverUrl}
              alt={`Cover of ${event.book.title}`}
              className="w-20 h-28 object-cover rounded-lg shadow-sm"
            />
          ) : (
            <div className="w-20 h-28 bg-gradient-to-br from-[var(--color-parchment)] to-[var(--color-tan)] rounded-lg flex items-center justify-center">
              <span className="text-3xl">📕</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with title and stars */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <h3 className="text-lg font-serif font-bold text-[var(--color-brown-dark)] leading-tight">
                {event.book.title}
              </h3>
              {event.book.author && (
                <p className="text-sm text-[var(--color-brown)] mt-0.5">by {event.book.author}</p>
              )}
            </div>
            {/* 5 stars */}
            <div className="flex-shrink-0 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="text-[var(--color-gold)] text-sm">★</span>
              ))}
            </div>
          </div>

          {/* Friend attribution */}
          <p className="text-sm text-[var(--color-brown-light)] mt-2 mb-2">
            <span className="font-medium text-[var(--color-brown)]">{event.friendName}</span>{' '}
            loved this
            {event.eventDate && (
              <span className="text-[var(--color-brown-light)]">
                {' '}· {formatDistanceToNow(new Date(event.eventDate), { addSuffix: true })}
              </span>
            )}
          </p>

          {/* Review snippet */}
          {event.reviewText && (
            <p className="text-sm text-[var(--color-brown)] line-clamp-2 mb-3 italic bg-[var(--color-parchment)]/50 rounded-lg px-3 py-2">
              &ldquo;{event.reviewText}&rdquo;
            </p>
          )}

          {/* Status badge */}
          {currentStatus && (
            <div className="mb-3">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  currentStatus === 'READ'
                    ? 'bg-[var(--color-green)]/10 text-[var(--color-green)]'
                    : 'bg-[var(--color-gold)]/20 text-[var(--color-brown)]'
                }`}
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
          <div className="flex items-center gap-2 flex-wrap">
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
                className="text-xs text-[var(--color-brown-light)] hover:text-[var(--color-brown)] transition-colors ml-auto"
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
