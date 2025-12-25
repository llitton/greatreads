'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MarkGiftPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to onboarding
  if (status === 'authenticated') {
    router.push('/feed');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('resend', {
        email,
        redirect: false,
        callbackUrl: '/feed',
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
    <div className="min-h-screen bg-[var(--color-cream)]">
      {/* Decorative header */}
      <div className="bg-[var(--color-brown-dark)] text-white py-4 text-center">
        <p className="text-sm">🎁 A Special Gift for You</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Gift card */}
        <div className="card p-8 md:p-12 text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--color-gold)] opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[var(--color-gold)] opacity-10 rounded-full translate-x-1/2 translate-y-1/2" />

          {/* Content */}
          <div className="relative z-10">
            <div className="text-6xl mb-6">📚</div>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--color-brown-dark)] mb-4">
              GreatReads
            </h1>

            <p className="text-xl text-[var(--color-brown)] mb-2">for</p>

            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--color-brown-dark)] mb-8">
              Mark Thomas Litton
            </h2>

            <div className="bg-[var(--color-parchment)] rounded-xl p-6 mb-8 text-left">
              <h3 className="font-serif font-bold text-[var(--color-brown-dark)] mb-3">
                What is GreatReads?
              </h3>
              <ul className="space-y-2 text-[var(--color-brown)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-gold)]">★</span>
                  <span>
                    See 5-star book recommendations from friends who use Goodreads
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-gold)]">★</span>
                  <span>
                    Get notified when someone you follow rates a book 5 stars
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-gold)]">★</span>
                  <span>
                    Track books you want to read and create your own Top 10 list
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-gold)]">★</span>
                  <span>Ask friends for their Top 10 books and share yours</span>
                </li>
              </ul>
            </div>

            {sent ? (
              <div className="bg-[var(--color-green)] bg-opacity-10 rounded-xl p-6">
                <div className="text-4xl mb-4">✉️</div>
                <h3 className="font-serif font-bold text-[var(--color-brown-dark)] mb-2">
                  Check your email!
                </h3>
                <p className="text-[var(--color-brown)]">
                  We sent a magic link to <strong>{email}</strong>. Click it to get started!
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[var(--color-brown)] mb-6">
                  Enter your email to claim your gift and get started:
                </p>

                <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />

                  {error && <p className="text-sm text-[var(--color-red)]">{error}</p>}

                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Claim Your Gift
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-[var(--color-brown-light)] mt-8">
          Made with love for Mark. Happy reading! 📖
        </p>
      </div>
    </div>
  );
}
