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

// Preview books with real covers from Open Library
const previewBooks = [
  {
    rank: 1,
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-M.jpg',
  },
  {
    rank: 2,
    title: 'The Art of Happiness',
    author: 'Dalai Lama',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781573221115-M.jpg',
  },
  {
    rank: 3,
    title: 'White Fragility',
    author: 'Robin DiAngelo',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780807047415-M.jpg',
  },
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
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header - identity, not data entry */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🏆</span>
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Your canon
          </span>
        </div>

        <h1 className="text-3xl font-semibold text-[#1f1a17] mb-4">
          Mark&apos;s Top 10
        </h1>

        <p className="text-[17px] leading-relaxed text-neutral-500 max-w-lg mb-8">
          {hasBooks
            ? 'The books that mattered most to you.'
            : 'These are the books that mattered most to you.'}
        </p>

        {/* Actions */}
        {!hasBooks ? (
          <div className="space-y-4">
            <Button onClick={() => setShowAddBook(true)} size="lg">
              Start your Top 10
            </Button>
            <p className="text-sm text-neutral-400">
              There&apos;s no right order. Just your order.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={() => setShowAddBook(true)}>
              Add Book
            </Button>
            <button
              onClick={() => setShowRequestForm(true)}
              className="text-sm text-neutral-500 hover:text-[#1f1a17] transition-colors"
            >
              Ask a friend for theirs
            </button>
          </div>
        )}
      </header>

      {/* Share link - only when has books */}
      {hasBooks && (
        <div className="mb-10 p-5 bg-neutral-50 rounded-2xl">
          <p className="text-sm font-medium text-[#1f1a17] mb-3">
            Share your list
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-4 py-2.5 text-sm bg-white border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
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
        /* Preview - what this will look like */
        <div className="space-y-8">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            What this will look like
          </p>

          <div className="space-y-4">
            {/* Preview books with real covers */}
            {previewBooks.map((book) => (
              <div
                key={book.rank}
                className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-black/5 shadow-sm opacity-70"
              >
                {/* Rank */}
                <span className="w-10 h-10 flex items-center justify-center text-xl font-semibold text-neutral-300 flex-shrink-0">
                  {book.rank}
                </span>
                {/* Cover */}
                <img
                  src={book.coverUrl}
                  alt=""
                  className="w-14 h-20 object-cover rounded-lg shadow-md flex-shrink-0"
                />
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1f1a17] mb-1">{book.title}</p>
                  <p className="text-sm text-neutral-500">{book.author}</p>
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {[4, 5, 6, 7, 8, 9, 10].map((rank) => (
              <div
                key={rank}
                className="flex items-center gap-5 p-5 rounded-2xl bg-neutral-50/50 border border-dashed border-neutral-200/80"
              >
                <span className="w-10 h-10 flex items-center justify-center text-xl font-semibold text-neutral-200 flex-shrink-0">
                  {rank}
                </span>
                <div className="w-14 h-20 bg-neutral-100/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-neutral-200 text-xl">+</span>
                </div>
                <div className="flex-1">
                  <p className="text-neutral-300 text-sm">—</p>
                </div>
              </div>
            ))}
          </div>

          {/* Encouragement */}
          <p className="text-center text-sm text-neutral-400">
            Most people don&apos;t fill this all at once.
          </p>
        </div>
      )}

      {/* Sent requests */}
      {requests.length > 0 && (
        <div className="mt-12 space-y-4">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Requests sent
          </p>
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div>
                  <p className="font-medium text-[#1f1a17]">{req.toEmail}</p>
                  <p className="text-sm text-neutral-400">
                    {new Date(req.createdAt).toLocaleDateString()}
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

      {/* Footer */}
      <footer className="mt-20 text-center">
        <p className="text-sm text-neutral-300 italic">
          This list changes as you do.
        </p>
      </footer>

      {/* Add book modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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
              <div className="text-center py-10">
                <p className="text-4xl mb-4">📚</p>
                <p className="text-neutral-600 mb-4">
                  No books in your library yet.
                </p>
                <Link
                  href="/my-books"
                  className="text-sm font-medium text-[#1f1a17] hover:underline"
                >
                  Add books first →
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {availableBooks
                  .filter((book) => !topTen?.items.some((item) => item.book.id === book.id))
                  .map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleAddBook(book.id)}
                      className="w-full flex items-center gap-4 p-3 text-left rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className="w-12 h-[72px] object-cover rounded-lg shadow-sm" />
                      ) : (
                        <div className="w-12 h-[72px] bg-neutral-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📕</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[#1f1a17]">
                          {book.title}
                        </p>
                        {book.author && (
                          <p className="text-sm text-neutral-500">{book.author}</p>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#1f1a17]">
                  Ask a friend
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  What&apos;s in your Top 10?
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
                <label className="block text-sm font-medium text-[#1f1a17] mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-4 py-3 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 resize-none"
                  rows={3}
                  placeholder="I'd love to know your favorites..."
                />
              </div>
              <Button onClick={handleSendRequest} loading={sendingRequest} className="w-full">
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
