'use client';

import { useEffect, useState } from 'react';
import { Top10List } from '@/components/top10/top10-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin text-4xl">🏆</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-[var(--color-brown-dark)]">
          My Top 10 Books
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowRequestForm(true)}>
            Ask a Friend
          </Button>
          <Button onClick={() => setShowAddBook(true)}>+ Add Book</Button>
        </div>
      </div>

      {/* Share link */}
      {topTen && topTen.items.length > 0 && (
        <div className="card p-4 mb-6 bg-[var(--color-parchment)]">
          <p className="text-sm font-medium text-[var(--color-brown-dark)] mb-2">
            Share your Top 10:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="input text-sm flex-1"
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

      {/* Top 10 list */}
      {topTen && (
        <Top10List items={topTen.items} onReorder={handleReorder} onRemove={handleRemove} />
      )}

      {/* Add book modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-[var(--color-brown-dark)]">
                Add to Top 10
              </h2>
              <button
                onClick={() => setShowAddBook(false)}
                className="text-[var(--color-brown-light)] hover:text-[var(--color-brown)]"
              >
                ✕
              </button>
            </div>
            {availableBooks.length === 0 ? (
              <p className="text-[var(--color-brown)]">
                No books available. Add some books from your feed first!
              </p>
            ) : (
              <div className="space-y-2">
                {availableBooks
                  .filter((book) => !topTen?.items.some((item) => item.book.id === book.id))
                  .map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleAddBook(book.id)}
                      className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-[var(--color-parchment)] transition-colors"
                    >
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className="w-10 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-14 bg-[var(--color-parchment)] rounded flex items-center justify-center">
                          📕
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--color-brown-dark)] truncate">
                          {book.title}
                        </p>
                        {book.author && (
                          <p className="text-sm text-[var(--color-brown)] truncate">{book.author}</p>
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
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-[var(--color-brown-dark)]">
                Ask for a Friend&apos;s Top 10
              </h2>
              <button
                onClick={() => setShowRequestForm(false)}
                className="text-[var(--color-brown-light)] hover:text-[var(--color-brown)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Their Email"
                type="email"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                placeholder="friend@example.com"
                required
              />
              <Input
                label="Their Name (optional)"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                placeholder="Jane"
              />
              <div>
                <label className="block text-sm font-medium text-[var(--color-brown-dark)] mb-1.5">
                  Message (optional)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="input min-h-[80px]"
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

      {/* Sent requests */}
      {requests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-serif font-bold text-[var(--color-brown-dark)] mb-4">
            Sent Requests
          </h2>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--color-brown-dark)]">{req.toEmail}</p>
                  <p className="text-sm text-[var(--color-brown-light)]">
                    Sent {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`badge ${
                    req.status === 'RESPONDED'
                      ? 'badge-success'
                      : req.status === 'VIEWED'
                        ? 'badge-warning'
                        : ''
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
