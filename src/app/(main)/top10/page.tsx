'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Top10List } from '@/components/top10/top10-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/status-pill';
import { BookCover } from '@/components/ui/book-cover';
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

type AddBookMode = 'library' | 'search' | 'swap';

interface ResolvedBook {
  bookId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  source: string;
  confidence: string;
  isNew: boolean;
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

// Prompts for empty slots - sparks memory
const slotPrompts: Record<number, string> = {
  4: 'A book you reread',
  5: 'A book you argue with',
  6: 'A book that surprised you',
  7: 'A book you give to people',
  8: 'A book that changed your mind',
  9: 'A book from your childhood',
  10: 'A book you wish you wrote',
};

export default function Top10Page() {
  const searchParams = useSearchParams();
  const [topTen, setTopTen] = useState<TopTen | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableBooks, setAvailableBooks] = useState<AvailableBook[]>([]);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requests, setRequests] = useState<Array<{ id: string; toEmail: string; status: string; createdAt: string }>>([]);

  // Revisit mode - when user comes from My Books with canon full
  const [revisitMode, setRevisitMode] = useState(false);

  // Edit mode - controls visibility of drag handles and remove buttons
  const [isEditMode, setIsEditMode] = useState(false);

  // Request form state
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // Add book modal state
  const [addBookMode, setAddBookMode] = useState<AddBookMode>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [resolvedBook, setResolvedBook] = useState<ResolvedBook | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Swap mode state - when list is full, user picks which book to replace
  const [bookToSwapIn, setBookToSwapIn] = useState<AvailableBook | ResolvedBook | null>(null);

  // Check for revisit mode from URL params
  useEffect(() => {
    if (searchParams.get('mode') === 'revisit') {
      setRevisitMode(true);
    }
  }, [searchParams]);

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

  const handleAddBook = async (bookId: string, bookData?: AvailableBook | ResolvedBook) => {
    if (!topTen) return;

    // Check if already in Top 10
    if (topTen.items.some((item) => item.book.id === bookId)) {
      alert('This book is already in your Top 10!');
      return;
    }

    // If list is full, enter swap mode
    if (topTen.items.length >= 10) {
      // Store the book we want to add
      const book = bookData || availableBooks.find((b) => b.id === bookId) || resolvedBook;
      if (book) {
        setBookToSwapIn({
          ...book,
          id: 'bookId' in book ? book.bookId : book.id,
        } as AvailableBook);
        setAddBookMode('swap');
      }
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
    closeAddBookModal();
    fetchTopTen();
  };

  // Handle swapping out an existing book for the new one
  const handleSwap = async (bookIdToRemove: string) => {
    if (!topTen || !bookToSwapIn) return;

    const bookIdToAdd = 'bookId' in bookToSwapIn ? bookToSwapIn.bookId : bookToSwapIn.id;

    // Replace the removed book with the new one, keeping the same rank
    const removedItem = topTen.items.find((item) => item.book.id === bookIdToRemove);
    if (!removedItem) return;

    const newItems = topTen.items
      .filter((item) => item.book.id !== bookIdToRemove)
      .map((item) => ({ bookId: item.book.id, rank: item.rank }));

    // Add the new book at the removed book's rank
    newItems.push({ bookId: bookIdToAdd, rank: removedItem.rank });

    // Re-sort by rank
    newItems.sort((a, b) => a.rank - b.rank);

    await fetch('/api/top10', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newItems }),
    });

    closeAddBookModal();
    fetchTopTen();
  };

  const closeAddBookModal = () => {
    setShowAddBook(false);
    setAddBookMode('library');
    setSearchQuery('');
    setSearchAuthor('');
    setResolvedBook(null);
    setSearchError(null);
    setBookToSwapIn(null);
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setResolvedBook(null);

    try {
      // Detect if it's an ISBN or URL
      const isIsbn = /^\d{10,13}$/.test(searchQuery.replace(/[-\s]/g, ''));
      const isUrl = searchQuery.startsWith('http');

      const res = await fetch('/api/books/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isIsbn ? { isbn: searchQuery } : isUrl ? { url: searchQuery } : { query: searchQuery }),
          author: searchAuthor || undefined,
          title: !isIsbn && !isUrl ? searchQuery : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSearchError(data.error || 'Book not found');
        return;
      }

      const book = await res.json();

      // Check if already in Top 10
      if (topTen?.items.some((item) => item.book.id === book.bookId)) {
        setSearchError('This book is already in your Top 10');
        return;
      }

      setResolvedBook(book);
    } catch {
      setSearchError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchAuthor, topTen]);

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
    <div className="max-w-3xl mx-auto px-5 py-8">
      {/* Revisit mode banner */}
      {revisitMode && topTen && topTen.items.length >= 10 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-amber-800 mb-1">
                Your canon is full
              </p>
              <p className="text-sm text-amber-700">
                To add a new book, you&apos;ll need to remove one. Which book no longer belongs?
              </p>
            </div>
            <button
              onClick={() => setRevisitMode(false)}
              className="text-amber-400 hover:text-amber-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 2l12 12M14 2L2 14" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header - identity, not data entry */}
      <header className="mb-8">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-5">
          Your canon
        </p>

        <h1 className="text-3xl font-serif font-semibold text-[#1f1a17] mb-3">
          Ten books that shaped how you see the world
        </h1>

        <p className="text-[17px] leading-relaxed text-neutral-500 max-w-lg mb-6">
          This list isn&apos;t about favorites. It&apos;s about influence.
        </p>

        {/* Actions - evolving CTA */}
        {!hasBooks ? (
          <div className="space-y-3">
            <Button onClick={() => setShowAddBook(true)} size="lg">
              Start your Top 10
            </Button>
            <p className="text-sm text-neutral-400">
              There&apos;s no right order. Just your order.
            </p>
          </div>
        ) : topTen && topTen.items.length < 10 ? (
          <div className="flex flex-wrap items-center gap-5">
            <Button onClick={() => setShowAddBook(true)}>
              Continue shaping your Top 10
            </Button>
            <button
              onClick={() => setShowRequestForm(true)}
              className="text-sm text-neutral-500 hover:text-[#1f1a17] transition-colors"
            >
              Ask a friend for theirs
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-5">
            {isEditMode ? (
              <Button onClick={() => setIsEditMode(false)} variant="secondary">
                Done editing
              </Button>
            ) : (
              <Button onClick={() => setIsEditMode(true)} variant="secondary">
                Revisit canon
              </Button>
            )}
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
        <div className="mb-8 p-5 bg-neutral-50 rounded-2xl">
          <p className="text-sm font-medium text-[#1f1a17] mb-3">
            Share your list
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 text-sm bg-white border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
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
        <>
          {/* Edit mode banner */}
          {isEditMode && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm text-amber-800">
                Editing mode · Drag to reorder, or remove books that no longer belong.
              </p>
            </div>
          )}

          {/* Progress indicator - only when not complete */}
          {topTen!.items.length < 10 && (
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                {topTen!.items.length} of 10 · <span className="text-neutral-400 italic">Your canon is taking shape</span>
              </p>
            </div>
          )}

          <Top10List items={topTen!.items} onReorder={handleReorder} onRemove={handleRemove} isEditMode={isEditMode || topTen!.items.length < 10} />

          {/* Next invitation - one at a time, not all at once */}
          {topTen!.items.length < 10 && (
            <div className="mt-8">
              {/* Single next prompt */}
              <button
                onClick={() => setShowAddBook(true)}
                className="w-full flex items-center gap-5 p-5 rounded-2xl bg-[#fdfcfa] border border-[#f0ebe3] hover:border-neutral-300 hover:bg-neutral-50 transition-all text-left group"
              >
                <span className="w-10 h-10 flex items-center justify-center text-xl font-serif text-neutral-300 group-hover:text-neutral-400 flex-shrink-0 transition-colors">
                  {topTen!.items.length + 1}
                </span>
                <div className="flex-1">
                  <p className="text-[15px] text-neutral-500 group-hover:text-neutral-700 transition-colors mb-1">
                    {slotPrompts[topTen!.items.length + 1] || 'A book that belongs here'}
                  </p>
                  <p className="text-xs text-neutral-300">
                    {10 - topTen!.items.length - 1} more waiting after this
                  </p>
                </div>
                <span className="text-neutral-300 group-hover:text-neutral-500 text-xl transition-colors">
                  +
                </span>
              </button>

              {/* Reassurance */}
              <p className="text-center text-sm text-neutral-400 mt-5">
                Most people add one or two at a time.
              </p>
              <p className="text-center text-xs text-neutral-300 italic mt-2">
                This list is meant to change as you do.
              </p>
            </div>
          )}
        </>
      ) : (
        /* Empty state - invitational, not vacant */
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Here&apos;s how this can look
            </p>
            <p className="text-xs text-neutral-300 italic">
              Examples from Laura
            </p>
          </div>

          <div className="space-y-4">
            {/* Preview books - clearly framed as example */}
            <div className="bg-[#fdfcfa] rounded-2xl p-4 border border-[#f0ebe3]">
              {previewBooks.map((book) => (
                <div
                  key={book.rank}
                  className="flex items-center gap-5 p-4"
                >
                  <span className="w-8 h-8 flex items-center justify-center text-lg text-neutral-400 flex-shrink-0">
                    {book.rank}
                  </span>
                  <BookCover
                    src={book.coverUrl}
                    title={book.title}
                    author={book.author}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1f1a17] mb-0.5">{book.title}</p>
                    <p className="text-sm text-neutral-500">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Prompts - as invitations to reflect */}
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide pt-5">
              Prompts to help you begin
            </p>
            {[4, 5, 6, 7].map((rank) => (
              <button
                key={rank}
                onClick={() => setShowAddBook(true)}
                className="w-full flex items-center gap-5 p-5 rounded-2xl bg-[#fdfcfa] border border-[#f0ebe3] hover:border-neutral-300 hover:bg-neutral-50 transition-all text-left group"
              >
                <span className="w-8 h-8 flex items-center justify-center text-lg text-neutral-300 group-hover:text-neutral-400 flex-shrink-0 transition-colors">
                  {rank}
                </span>
                <div className="flex-1">
                  <p className="text-[15px] text-neutral-400 group-hover:text-neutral-600 transition-colors">
                    {slotPrompts[rank]}
                  </p>
                </div>
                <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors">
                  +
                </span>
              </button>
            ))}

            {/* Remaining slots - collapsed */}
            <p className="text-center text-xs text-neutral-300 pt-2">
              + 3 more slots waiting
            </p>
          </div>

          {/* Encouragement - reframed as permission */}
          <div className="text-center space-y-2 pt-5">
            <p className="text-sm text-neutral-500">
              Most people add one or two at a time.
            </p>
            <p className="text-xs text-neutral-400 italic">
              This list is meant to evolve.
            </p>
          </div>
        </div>
      )}

      {/* Sent requests */}
      {requests.length > 0 && (
        <div className="mt-8 space-y-5">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Requests sent
          </p>
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-5 bg-neutral-50 rounded-xl">
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

      {/* Footer - emotional closure */}
      <footer className="mt-8 pt-8 border-t border-neutral-50 text-center">
        <p className="text-sm text-neutral-300 italic leading-relaxed">
          Your canon can change. It usually does.
        </p>
      </footer>

      {/* Add book modal - two modes */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-black/5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold text-[#1f1a17]">
                  {addBookMode === 'swap' ? 'Replace a book' : 'Add a book to your Top 10'}
                </h2>
                <button
                  onClick={closeAddBookModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1l12 12M13 1L1 13" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-neutral-400">
                {addBookMode === 'swap'
                  ? 'Ten books. Ranked. No ties.'
                  : 'Choose from your library, or add any book.'}
              </p>

              {/* Mode toggle - hidden during swap mode */}
              {addBookMode !== 'swap' && (
                <div className="flex gap-1 mt-4">
                  <StatusPill
                    variant="default"
                    selected={addBookMode === 'library'}
                    onClick={() => {
                      setAddBookMode('library');
                      setResolvedBook(null);
                      setSearchError(null);
                    }}
                  >
                    From your library
                  </StatusPill>
                  <StatusPill
                    variant="default"
                    selected={addBookMode === 'search'}
                    onClick={() => {
                      setAddBookMode('search');
                      setResolvedBook(null);
                      setSearchError(null);
                    }}
                  >
                    Add any book
                  </StatusPill>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {addBookMode === 'swap' && bookToSwapIn ? (
                /* Swap mode - list is full, pick which to replace */
                <div className="space-y-4">
                  {/* Show the book being added */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-3">
                      Adding to your Top 10
                    </p>
                    <div className="flex gap-3">
                      <BookCover
                        src={bookToSwapIn.coverUrl}
                        title={bookToSwapIn.title}
                        author={bookToSwapIn.author}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-emerald-900">{bookToSwapIn.title}</p>
                        {bookToSwapIn.author && (
                          <p className="text-sm text-emerald-700">{bookToSwapIn.author}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prompt to pick book to remove */}
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-1">
                      Your Top 10 is full.
                    </p>
                    <p className="text-sm text-neutral-400">
                      Which book should it replace?
                    </p>
                  </div>

                  {/* Current Top 10 books to swap out */}
                  <div className="space-y-1">
                    {topTen?.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSwap(item.book.id)}
                        className="w-full flex items-center gap-4 p-3 text-left rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors group"
                      >
                        <span className="w-6 h-6 flex items-center justify-center text-sm font-medium text-neutral-400 group-hover:text-red-400">
                          {item.rank}
                        </span>
                        <BookCover
                          src={item.book.coverUrl}
                          title={item.book.title}
                          author={item.book.author}
                          size="xs"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#1f1a17] truncate group-hover:text-red-700">
                            {item.book.title}
                          </p>
                          {item.book.author && (
                            <p className="text-sm text-neutral-500 truncate group-hover:text-red-500">{item.book.author}</p>
                          )}
                        </div>
                        <span className="text-neutral-300 group-hover:text-red-400 transition-colors">
                          ↔
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Cancel */}
                  <button
                    onClick={() => {
                      setAddBookMode('library');
                      setBookToSwapIn(null);
                    }}
                    className="w-full text-sm text-neutral-400 hover:text-neutral-600 py-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : addBookMode === 'library' ? (
                /* Library mode */
                <>
                  {availableBooks.filter((book) => !topTen?.items.some((item) => item.book.id === book.id)).length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-4xl mb-4">📚</p>
                      <p className="text-neutral-600 mb-4">
                        {availableBooks.length === 0
                          ? 'No books in your library yet.'
                          : 'All your books are already in your Top 10!'}
                      </p>
                      <button
                        onClick={() => setAddBookMode('search')}
                        className="text-sm font-medium text-[#1f1a17] hover:underline"
                      >
                        Add any book instead →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {availableBooks
                        .filter((book) => !topTen?.items.some((item) => item.book.id === book.id))
                        .map((book) => (
                          <button
                            key={book.id}
                            onClick={() => handleAddBook(book.id, book)}
                            className="w-full flex items-center gap-4 p-3 text-left rounded-xl hover:bg-neutral-50 transition-colors"
                          >
                            <BookCover
                              src={book.coverUrl}
                              title={book.title}
                              author={book.author}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[#1f1a17] truncate">
                                {book.title}
                              </p>
                              {book.author && (
                                <p className="text-sm text-neutral-500 truncate">{book.author}</p>
                              )}
                            </div>
                            <span className="text-neutral-300 text-lg">+</span>
                          </button>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                /* Search mode */
                <div className="space-y-4">
                  {/* Search input */}
                  <div>
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setResolvedBook(null);
                        setSearchError(null);
                      }}
                      placeholder="Search by title or author"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <p className="text-xs text-neutral-400 mt-2">
                      You can also paste a Goodreads link or ISBN.
                    </p>
                  </div>

                  {/* Optional author field */}
                  <div>
                    <Input
                      value={searchAuthor}
                      onChange={(e) => setSearchAuthor(e.target.value)}
                      placeholder="Author (optional, helps accuracy)"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>

                  {/* Search button */}
                  <Button
                    onClick={handleSearch}
                    loading={isSearching}
                    disabled={!searchQuery.trim()}
                    className="w-full"
                  >
                    {isSearching ? 'Searching...' : 'Find book'}
                  </Button>

                  {/* Error message */}
                  {searchError && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-sm text-red-600">{searchError}</p>
                    </div>
                  )}

                  {/* Resolved book preview */}
                  {resolvedBook && (
                    <div className="p-4 bg-[#fdfcfa] rounded-xl border border-[#f0ebe3]">
                      <div className="flex gap-4">
                        <BookCover
                          src={resolvedBook.coverUrl}
                          title={resolvedBook.title}
                          author={resolvedBook.author}
                          size="lg"
                          className="shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1f1a17]">{resolvedBook.title}</p>
                          {resolvedBook.author && (
                            <p className="text-sm text-neutral-500">{resolvedBook.author}</p>
                          )}
                          <p className="text-xs text-neutral-400 mt-2">
                            {resolvedBook.isNew ? 'New book added' : 'Found in database'}
                            {resolvedBook.confidence === 'high' && ' · High confidence'}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddBook(resolvedBook.bookId, resolvedBook)}
                        className="w-full mt-4"
                      >
                        Add to Top 10
                      </Button>
                    </div>
                  )}

                  {/* Manual entry hint */}
                  {!resolvedBook && !isSearching && !searchError && searchQuery && (
                    <p className="text-xs text-neutral-400 text-center">
                      Press Enter or click &ldquo;Find book&rdquo; to search
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request form modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
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
            <div className="space-y-3">
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
                  className="w-full px-3 py-3 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 resize-none"
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
