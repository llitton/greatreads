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
    <article className="bg-white rounded-xl border border-[#e8e0d4] shadow-sm hover:shadow-md transition-shadow animate-fadeIn overflow-hidden">
      {/* Book spine accent */}
      <div className="flex">
        <div className="w-1.5 bg-gradient-to-b from-[#d4a855] to-[#c49845] flex-shrink-0" />

        <div className="flex-1 p-6">
          <div className="flex gap-5">
            {/* Book cover */}
            <div className="flex-shrink-0">
              {event.book.coverUrl ? (
                <img
                  src={event.book.coverUrl}
                  alt={`Cover of ${event.book.title}`}
                  className="w-20 h-28 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-20 h-28 bg-gradient-to-br from-[#f5f0e6] to-[#e8e0d4] rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-3xl">📕</span>
                </div>
              )}
            </div>

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
                {/* 5 stars */}
                <div className="flex-shrink-0 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-[#d4a855] text-sm">★</span>
                  ))}
                </div>
              </div>

              {/* Friend attribution */}
              <p className="text-sm text-[#8b7355] mt-3 mb-3">
                <span className="font-medium text-[#5b4a3f]">{event.friendName}</span>{' '}
                loved this
                {event.eventDate && (
                  <span>
                    {' '}· {formatDistanceToNow(new Date(event.eventDate), { addSuffix: true })}
                  </span>
                )}
              </p>

              {/* Review snippet */}
              {event.reviewText && (
                <p className="text-sm text-[#5b4a3f] line-clamp-2 mb-4 italic bg-[#fbf7ef] rounded-lg px-4 py-3 border-l-2 border-[#d4a855]">
                  &ldquo;{event.reviewText}&rdquo;
                </p>
              )}

              {/* Status badge */}
              {currentStatus && (
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      currentStatus === 'READ'
                        ? 'bg-[#4a7c59]/10 text-[#4a7c59]'
                        : 'bg-[#d4a855]/20 text-[#5b4a3f]'
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
