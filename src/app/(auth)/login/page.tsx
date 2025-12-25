'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

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
        setError('Failed to send magic link. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8">
      {sent ? (
        <div className="text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-serif font-bold text-[var(--color-brown-dark)] mb-2">
            Check your email
          </h2>
          <p className="text-[var(--color-brown)]">
            We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-4 text-sm text-[var(--color-brown)] underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-serif font-bold text-[var(--color-brown-dark)] mb-6 text-center">
            Sign in or create account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            {error && <p className="text-sm text-[var(--color-red)]">{error}</p>}

            <Button type="submit" loading={loading} className="w-full">
              Continue with Email
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-[var(--color-brown-light)]">
            We&apos;ll send you a magic link to sign in instantly. No password needed.
          </p>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-brown-dark)]">
            GreatReads
          </h1>
          <p className="mt-2 text-[var(--color-brown)]">
            Discover 5-star books from your friends
          </p>
        </div>

        {/* Card with Suspense */}
        <Suspense fallback={<div className="card p-8 animate-pulse h-64" />}>
          <LoginForm />
        </Suspense>

        {/* Gift link */}
        <p className="mt-6 text-center text-sm text-[var(--color-brown)]">
          Got a gift code?{' '}
          <Link href="/mark" className="underline font-medium">
            Click here
          </Link>
        </p>
      </div>
    </div>
  );
}
