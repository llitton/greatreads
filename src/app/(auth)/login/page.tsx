'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Mini book chips for the shelf teaser
function BookChip({ title, color }: { title: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border shadow-sm"
      style={{
        backgroundColor: color === 'light' ? '#f5f5f5' : color === 'dark' ? '#1f1a17' : '#d4a855',
        color: color === 'dark' ? '#ffffff' : '#1f1a17',
        borderColor: color === 'light' ? '#e8e0d4' : 'transparent',
      }}
    >
      <span className="text-sm">📕</span>
      <span className="truncate max-w-[120px]">{title}</span>
    </div>
  );
}

function EmailSentState({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8e0d4] shadow-lg overflow-hidden">
      {/* Book spine accent */}
      <div className="flex">
        <div className="w-2 bg-gradient-to-b from-[#d4a855] to-[#c49845] flex-shrink-0" />

        <div className="flex-1 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#fbf7ef] flex items-center justify-center text-3xl">
              ✉️
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-2xl font-serif font-bold text-[#1f1a17] text-center mb-3">
            Mark, your GreatReads invite is on the way
          </h2>

          {/* Body */}
          <p className="text-[#5b4a3f] text-center mb-2 text-[15px]">
            We emailed a sign-in link to <strong className="text-[#1f1a17]">{email}</strong>
          </p>
          <p className="text-sm text-[#8b7355] text-center mb-8">
            If you don&apos;t see it in a minute, check Spam or Promotions.
          </p>

          {/* Mark's Shelf teaser */}
          <div className="bg-[#fbf7ef] rounded-xl p-5 mb-8 border border-[#e8e0d4]">
            <p className="text-xs text-[#8b7355] text-center mb-3">Starting shelf: your favorites</p>
            <div className="flex flex-wrap justify-center gap-2">
              <BookChip title="White Fragility" color="light" />
              <BookChip title="Thinking, Fast and Slow" color="dark" />
              <BookChip title="The Art of Happiness" color="gold" />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <a
              href="https://mail.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#1f1a17] text-white font-medium rounded-lg hover:bg-[#3d3530] transition-colors"
            >
              Open Gmail
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 11L11 3M11 3H5M11 3v6" />
              </svg>
            </a>

            <button
              onClick={onReset}
              className="w-full px-6 py-3 text-[#5b4a3f] font-medium rounded-lg border border-[#e8e0d4] hover:bg-[#fbf7ef] transition-colors"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/feed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('resend', {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Failed to send sign-in link. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return <EmailSentState email={email} onReset={() => setSent(false)} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e8e0d4] shadow-lg overflow-hidden">
      {/* Book spine accent */}
      <div className="flex">
        <div className="w-2 bg-gradient-to-b from-[#d4a855] to-[#c49845] flex-shrink-0" />

        <div className="flex-1 p-8">
          <h2 className="text-xl font-serif font-bold text-[#1f1a17] mb-6 text-center">
            Sign in or create account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            {error && (
              <p className="text-sm text-[#9c3d3d] bg-[#9c3d3d]/10 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Continue with Email
            </Button>
          </form>

          <p className="mt-5 text-xs text-center text-[#8b7355]">
            We&apos;ll send you a sign-in link. No password needed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6f0] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-3xl font-serif font-bold text-[#1f1a17]">
            GreatReads
          </h1>
          <p className="mt-2 text-[#5b4a3f]">
            Discover 5-star books from your friends
          </p>
        </div>

        {/* Card with Suspense */}
        <Suspense fallback={<div className="bg-white rounded-2xl p-8 animate-pulse h-64 shadow-lg" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
