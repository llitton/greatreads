'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddFriendFormProps {
  onAdd: (label: string, rssUrl: string) => Promise<void>;
}

interface TestResult {
  success: boolean;
  totalItems: number;
  fiveStarItems: number;
  sampleItems: Array<{
    title: string;
    author: string | null;
    rating: number | null;
    isFiveStar: boolean;
  }>;
  error?: string;
}

export function AddFriendForm({ onAdd }: AddFriendFormProps) {
  const [label, setLabel] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleTest = async () => {
    if (!rssUrl) return;
    setTesting(true);
    setTestResult(null);
    setError('');

    try {
      const res = await fetch('/api/rss/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rssUrl }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setError('Failed to test feed');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !rssUrl) return;

    setLoading(true);
    setError('');

    try {
      await onAdd(label, rssUrl);
      setLabel('');
      setRssUrl('');
      setTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-tan)] p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[var(--color-parchment)] flex items-center justify-center text-xl">
          👤
        </div>
        <div>
          <h3 className="font-serif font-bold text-[var(--color-brown-dark)]">
            Add someone whose taste you trust
          </h3>
          <p className="text-sm text-[var(--color-brown-light)]">
            We&apos;ll watch for their 5-star books
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Friend's name"
          placeholder="e.g., Sarah"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />

        <div>
          <Input
            label="Their Goodreads feed URL"
            placeholder="https://www.goodreads.com/review/list_rss/..."
            value={rssUrl}
            onChange={(e) => setRssUrl(e.target.value)}
            type="url"
            required
          />

          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs text-[var(--color-brown)] underline underline-offset-2 hover:no-underline"
            >
              {showHelp ? 'Hide help' : 'How do I find this?'}
            </button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleTest}
              loading={testing}
              disabled={!rssUrl}
            >
              Test feed
            </Button>
          </div>
        </div>

        {/* Help text - collapsible */}
        {showHelp && (
          <div className="bg-[var(--color-parchment)] rounded-lg p-4 text-sm animate-fadeIn">
            <p className="font-medium text-[var(--color-brown-dark)] mb-2">
              Finding a Goodreads feed URL:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[var(--color-brown)]">
              <li>Go to your friend&apos;s Goodreads profile</li>
              <li>Click &quot;Read&quot; under their bookshelves</li>
              <li>Look for the RSS icon at the bottom of the page</li>
              <li>Copy that URL and paste it here</li>
            </ol>
            <p className="mt-3 text-xs text-[var(--color-brown-light)]">
              Format: goodreads.com/review/list_rss/[user_id]?shelf=read
            </p>
          </div>
        )}

        {/* Test results */}
        {testResult && (
          <div
            className={`rounded-lg p-4 text-sm animate-fadeIn ${
              testResult.success
                ? 'bg-[var(--color-green)]/10 border border-[var(--color-green)]/20'
                : 'bg-[var(--color-red)]/10 border border-[var(--color-red)]/20'
            }`}
          >
            {testResult.success ? (
              <>
                <p className="font-medium text-[var(--color-green)] mb-2">
                  ✓ Found {testResult.fiveStarItems} five-star books!
                </p>
                {testResult.sampleItems.filter(i => i.isFiveStar).length > 0 && (
                  <div className="mt-2">
                    <p className="text-[var(--color-brown)] text-xs mb-1">Recent 5-star picks:</p>
                    <ul className="space-y-1">
                      {testResult.sampleItems
                        .filter(i => i.isFiveStar)
                        .slice(0, 2)
                        .map((item, i) => (
                          <li key={i} className="text-[var(--color-brown)] flex items-center gap-1">
                            <span className="text-[var(--color-gold)]">★</span>
                            <span className="truncate">{item.title}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[var(--color-red)]">
                Couldn&apos;t read this feed. Check that the URL is correct.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-[var(--color-red)] bg-[var(--color-red)]/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} disabled={!label || !rssUrl} className="w-full">
          Add Friend
        </Button>
      </form>
    </div>
  );
}
