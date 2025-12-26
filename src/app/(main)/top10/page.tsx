'use client';

import { useEffect, useState } from 'react';
import { Top10List } from '@/components/top10/top10-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface TopTenItem {
  id: string;
  rank: number;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

interface TopTen {
  id: string;
  name: string;
  isPublic: boolean;
  items: TopTenItem[];
}

interface AvailableBook {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
}

// Static preview data for empty state
const previewBooks = [
  { rank: 1, title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
  { rank: 2, title: 'The Art of Happiness', author: 'Dalai Lama' },
  { rank: 3, title: 'White Fragility', author: 'Robin DiAngelo' },
];

export default function Top10Page() {
  const [topTen, setTopTen] = useState<TopTen | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableBooks, setAvailableBooks] = useState<AvailableBook[]>([]);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requests, setRequests] = useState<Array<{ id: string; toEmail: string; status: string; createdAt: string }>>([]);

  // Request form state
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    fetchTopTen();
    fetchAvailableBooks();
    fetchRequests();
  }, []);

  const fetchTopTen = async () => {
    try {
      const res = await fetch('/api/top10');
      const data = await res.json();
      setTopTen(data);
    } catch (error) {
      console.error('Failed to fetch Top 10:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      const res = await fetch('/api/books/status');
      const data = await res.json();
      setAvailableBooks(data.map((item: { book: AvailableBook }) => item.book));
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/top10/request');
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const handleReorder = async (items: Array<{ bookId: string; rank: number }>) => {
    await fetch('/api/top10', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    fetchTopTen();
  };

  const handleRemove = async (bookId: string) => {
    if (!topTen) return;
    const newItems = topTen.items
      .filter((item) => item.book.id !== bookId)
      .map((item, index) => ({ bookId: item.book.id, rank: index + 1 }));

    await fetch('/api/top10', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newItems }),
    });
    fetchTopTen();
  };

  const handleAddBook = async (bookId: string) => {
    if (!topTen) return;
    if (topTen.items.length >= 10) {
      alert('Your Top 10 is full! Remove a book first.');
      return;
    }
    if (topTen.items.some((item) => item.book.id === bookId)) {
      alert('This book is already in your Top 10!');
      return;
    }

    const newItems = [
      ...topTen.items.map((item) => ({ bookId: item.book.id, rank: item.rank })),
      { bookId, rank: topTen.items.length + 1 },
    ];

    await fetch('/api/top10', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newItems }),
    });
    setShowAddBook(false);
    fetchTopTen();
  };

  const handleSendRequest = async () => {
    if (!requestEmail) return;
    setSendingRequest(true);

    try {
      const res = await fetch('/api/top10/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: requestEmail,
          toName: requestName || undefined,
          message: requestMessage || undefined,
        }),
      });

      if (res.ok) {
        setShowRequestForm(false);
        setRequestEmail('');
        setRequestName('');
        setRequestMessage('');
        fetchRequests();
        alert('Request sent successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send request');
      }
    } catch {
      alert('Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  const shareUrl = topTen ? `${window.location.origin}/u/${topTen.id}/top10` : '';
  const hasBooks = topTen && topTen.items.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🏆</div>
          <p className="text-neutral-500">Loading your list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero section */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-10">
        <div className="max-w-2xl">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1f1a17] text-white text-2xl flex items-center justify-center flex-shrink-0">
              🏆
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#1f1a17] mb-1">
                Mark&apos;s Top 10 Books
              </h1>
              <p className="text-[15px] text-neutral-500">
                The books that shaped how you think.
              </p>
            </div>
          </div>

          {/* Explanation */}
          <p className="text-[15px] leading-relaxed text-neutral-600 mb-8">
            Your Top 10 is a ranked list of the books that mattered most to you.
            You can reorder them anytime and share your list with friends.
          </p>

          {/* Actions */}
          {!hasBooks ? (
            <div className="space-y-4">
              <Button onClick={() => setShowAddBook(true)} className="w-full sm:w-auto">
                Add your first book
              </Button>
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="text-neutral-500 hover:text-[#1f1a17] transition-colors"
                >
                  Ask a friend
                </button>
                <span className="text-neutral-300">·</span>
                <Link
                  href="/my-books"
                  className="text-neutral-500 hover:text-[#1f1a17] transition-colors"
                >
                  Browse My Books
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setShowAddBook(true)}>
                + Add Book
              </Button>
              <Button variant="secondary" onClick={() => setShowRequestForm(true)}>
                Ask a friend
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Share link - only when has books */}
      {hasBooks && (
        <div className="bg-neutral-50 rounded-2xl p-5">
          <p className="text-sm font-medium text-[#1f1a17] mb-2">
            Share your Top 10
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-4 py-2 text-sm bg-white border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                alert('Link copied!');
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      )}

      {/* List or Preview */}
      {hasBooks ? (
        <Top10List items={topTen!.items} onReorder={handleReorder} onRemove={handleRemove} />
      ) : (
        /* Static preview for empty state */
        <div className="space-y-6">
          <div className="space-y-2">
            {/* Show preview books */}
            {previewBooks.map((book) => (
              <div
                key={book.rank}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-black/5 shadow-sm opacity-60"
              >
                <span className="w-8 h-8 flex items-center justify-center bg-[#d4a855] text-white text-sm font-bold rounded-full">
                  {book.rank}
                </span>
                <div className="w-10 h-14 bg-neutral-100 rounded flex items-center justify-center">
                  <span className="text-lg">📕</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1f1a17] truncate">{book.title}</p>
                  <p className="text-sm text-neutral-500 truncate">{book.author}</p>
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {[4, 5, 6, 7, 8, 9, 10].map((rank) => (
              <div
                key={rank}
                className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-neutral-200"
              >
                <span className="w-8 h-8 flex items-center justify-center bg-neutral-100 text-neutral-400 text-sm font-medium rounded-full">
                  {rank}
                </span>
                <div className="flex-1">
                  <p className="text-neutral-300">—</p>
                </div>
              </div>
            ))}
          </div>

          {/* Helper text */}
          <p className="text-center text-sm text-neutral-400">
            Drag books to reorder once you add them.
          </p>
        </div>
      )}

      {/* Sent requests */}
      {requests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1f1a17]">
            Sent Requests
          </h2>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-black/5 shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1f1a17]">{req.toEmail}</p>
                  <p className="text-sm text-neutral-400">
                    Sent {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    req.status === 'RESPONDED'
                      ? 'bg-emerald-50 text-emerald-600'
                      : req.status === 'VIEWED'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {req.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closing line */}
      <p className="text-center text-sm text-neutral-300 italic pt-4">
        This list changes as you do.
      </p>

      {/* Add book modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1f1a17]">
                Add to your Top 10
              </h2>
              <button
                onClick={() => setShowAddBook(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
            {availableBooks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-neutral-600 mb-4">
                  No books available yet.
                </p>
                <Link
                  href="/my-books"
                  className="text-sm font-medium text-[#1f1a17] hover:underline"
                >
                  Add some books first →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {availableBooks
                  .filter((book) => !topTen?.items.some((item) => item.book.id === book.id))
                  .map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleAddBook(book.id)}
                      className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className="w-10 h-14 object-cover rounded shadow-sm" />
                      ) : (
                        <div className="w-10 h-14 bg-neutral-100 rounded flex items-center justify-center">
                          📕
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[#1f1a17] truncate">
                          {book.title}
                        </p>
                        {book.author && (
                          <p className="text-sm text-neutral-500 truncate">{book.author}</p>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request form modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#1f1a17]">
                  Ask a friend
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  &quot;What&apos;s in your Top 10?&quot;
                </p>
              </div>
              <button
                onClick={() => setShowRequestForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Their email"
                type="email"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                placeholder="friend@example.com"
                required
              />
              <Input
                label="Their name (optional)"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                placeholder="Jane"
              />
              <div>
                <label className="block text-sm font-medium text-[#1f1a17] mb-1.5">
                  Message (optional)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 resize-none"
                  rows={3}
                  placeholder="Hey! I'd love to know your top 10 favorite books..."
                />
              </div>
              <Button onClick={handleSendRequest} loading={sendingRequest} className="w-full">
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
