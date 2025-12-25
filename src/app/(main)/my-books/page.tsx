'use client';

import { useEffect, useState } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';

interface UserBookStatus {
  id: string;
  status: 'WANT_TO_READ' | 'READING' | 'READ';
  userRating: number | null;
  userNotes: string | null;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

export default function MyBooksPage() {
  const [books, setBooks] = useState<UserBookStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'WANT_TO_READ' | 'READING' | 'READ'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books/status');
      const data = await res.json();
      setBooks(data);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookId: string, status: 'WANT_TO_READ' | 'READING' | 'READ') => {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, status }),
    });
    fetchBooks();
  };

  const handleSaveEdit = async (bookId: string) => {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId,
        userRating: editRating || null,
        userNotes: editNotes || null,
      }),
    });
    setEditingId(null);
    fetchBooks();
  };

  const startEdit = (book: UserBookStatus) => {
    setEditingId(book.book.id);
    setEditRating(book.userRating || 0);
    setEditNotes(book.userNotes || '');
  };

  const filteredBooks = filter === 'all' ? books : books.filter((b) => b.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin text-4xl">📚</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-[var(--color-brown-dark)] mb-6">
        My Books
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'all', label: 'All' },
          { value: 'WANT_TO_READ', label: 'Want to Read' },
          { value: 'READING', label: 'Reading' },
          { value: 'READ', label: 'Read' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-[var(--color-brown-dark)] text-white'
                : 'bg-[var(--color-parchment)] text-[var(--color-brown)] hover:bg-[var(--color-tan)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Books list */}
      {filteredBooks.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-[var(--color-brown)]">
            {filter === 'all'
              ? "You haven't added any books yet. Check out your feed to discover books!"
              : `No books in this category yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBooks.map((item) => (
            <div key={item.id} className="card p-4">
              <div className="flex gap-4">
                {/* Cover */}
                {item.book.coverUrl ? (
                  <img
                    src={item.book.coverUrl}
                    alt=""
                    className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 bg-[var(--color-parchment)] rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📕</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-[var(--color-brown-dark)]">
                    {item.book.title}
                  </h3>
                  {item.book.author && (
                    <p className="text-sm text-[var(--color-brown)]">{item.book.author}</p>
                  )}

                  {/* Status badge */}
                  <div className="mt-2">
                    <span
                      className={`badge ${
                        item.status === 'READ'
                          ? 'badge-success'
                          : item.status === 'READING'
                            ? 'badge-warning'
                            : ''
                      }`}
                    >
                      {item.status === 'READ'
                        ? '✓ Read'
                        : item.status === 'READING'
                          ? '📖 Reading'
                          : '📌 Want to Read'}
                    </span>
                  </div>

                  {/* Edit mode */}
                  {editingId === item.book.id ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-brown-dark)] mb-1">
                          My Rating
                        </label>
                        <StarRating value={editRating} onChange={setEditRating} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-brown-dark)] mb-1">
                          My Notes
                        </label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="input min-h-[80px]"
                          placeholder="Add your thoughts about this book..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(item.book.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Rating and notes display */}
                      {item.userRating && (
                        <div className="mt-2">
                          <StarRating value={item.userRating} readonly size="sm" />
                        </div>
                      )}
                      {item.userNotes && (
                        <p className="mt-2 text-sm text-[var(--color-brown)] italic line-clamp-2">
                          &ldquo;{item.userNotes}&rdquo;
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {item.status !== 'READ' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateStatus(item.book.id, 'READ')}
                          >
                            Mark as Read
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                          {item.userRating || item.userNotes ? 'Edit' : 'Add Rating/Notes'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
