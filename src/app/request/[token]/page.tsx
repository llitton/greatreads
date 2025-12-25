'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RequestData {
  id: string;
  fromUserName: string;
  message: string | null;
  status: string;
  responseData: Array<{ title: string; author?: string; rank: number }> | null;
}

interface BookEntry {
  title: string;
  author: string;
  rank: number;
}

export default function TopTenRequestPage() {
  const params = useParams();
  const token = params.token as string;

  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [books, setBooks] = useState<BookEntry[]>(
    Array.from({ length: 10 }, (_, i) => ({ title: '', author: '', rank: i + 1 }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [token]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/top10/request/${token}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
        if (data.status === 'RESPONDED' && data.responseData) {
          setSubmitted(true);
        }
      } else {
        setError('This request was not found or has expired.');
      }
    } catch {
      setError('Failed to load request.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const validBooks = books.filter((b) => b.title.trim());
    if (validBooks.length === 0) {
      alert('Please add at least one book!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/top10/request/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          books: validBooks.map((b, i) => ({
            title: b.title.trim(),
            author: b.author.trim() || undefined,
            rank: i + 1,
          })),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit');
      }
    } catch {
      alert('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const updateBook = (index: number, field: 'title' | 'author', value: string) => {
    setBooks((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)]">
        <div className="animate-spin text-4xl">📚</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-[var(--color-brown)]">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-serif font-bold text-[var(--color-brown-dark)] mb-4">
            Thank you!
          </h1>
          <p className="text-[var(--color-brown)]">
            Your Top 10 has been shared with {request?.fromUserName}. They&apos;ll be excited to see
            your favorite books!
          </p>
          <p className="mt-6 text-sm text-[var(--color-brown-light)]">
            Want to track your own reading?{' '}
            <a href="/login" className="underline">
              Create a GreatReads account
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📚</div>
          <h1 className="text-2xl font-serif font-bold text-[var(--color-brown-dark)]">
            {request?.fromUserName} wants to know your Top 10 books!
          </h1>
          {request?.message && (
            <div className="mt-4 bg-[var(--color-parchment)] rounded-lg p-4 text-left">
              <p className="text-[var(--color-brown)] italic">&ldquo;{request.message}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="card p-6">
          <p className="text-sm text-[var(--color-brown)] mb-6">
            Share your favorite books of all time. You don&apos;t need to fill all 10 slots!
          </p>

          <div className="space-y-4">
            {books.map((book, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-gold)] text-white text-sm font-bold rounded-full flex-shrink-0 mt-2">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Book title"
                    value={book.title}
                    onChange={(e) => updateBook(index, 'title', e.target.value)}
                  />
                  <Input
                    placeholder="Author (optional)"
                    value={book.author}
                    onChange={(e) => updateBook(index, 'author', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSubmit} loading={submitting} className="w-full mt-6">
            Share My Top 10
          </Button>
        </div>
      </div>
    </div>
  );
}
