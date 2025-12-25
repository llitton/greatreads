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
      setError('Failed to test RSS feed');
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
    <div className="card p-6">
      <h3 className="text-lg font-serif font-bold text-[var(--color-brown-dark)] mb-4">
        Add a Friend&apos;s Goodreads Feed
      </h3>

      {/* Helper text */}
      <div className="bg-[var(--color-parchment)] rounded-lg p-4 mb-4 text-sm">
        <p className="font-medium text-[var(--color-brown-dark)] mb-2">
          How to find a friend&apos;s RSS URL:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[var(--color-brown)]">
          <li>Go to your friend&apos;s Goodreads profile</li>
          <li>Click on &quot;Recent Updates&quot; in the sidebar</li>
          <li>Look for the RSS icon and copy the URL</li>
          <li>Or use their shelf RSS: goodreads.com/review/list_rss/[user_id]?shelf=read</li>
        </ol>
        <p className="mt-2 text-xs text-[var(--color-brown-light)]">
          Note: Only use feeds you have permission to access.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Friend's Name"
          placeholder="e.g., Jane Smith"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />

        <div>
          <Input
            label="RSS Feed URL"
            placeholder="https://www.goodreads.com/..."
            value={rssUrl}
            onChange={(e) => setRssUrl(e.target.value)}
            type="url"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleTest}
            loading={testing}
            disabled={!rssUrl}
            className="mt-2"
          >
            Test RSS Feed
          </Button>
        </div>

        {/* Test results */}
        {testResult && (
          <div
            className={`rounded-lg p-4 text-sm ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
          >
            {testResult.success ? (
              <>
                <p className="font-medium text-green-800 mb-2">
                  ✓ Feed is valid! Found {testResult.totalItems} items, {testResult.fiveStarItems}{' '}
                  with 5 stars.
                </p>
                {testResult.sampleItems.length > 0 && (
                  <div className="mt-2">
                    <p className="text-green-700 font-medium">Sample items:</p>
                    <ul className="mt-1 space-y-1">
                      {testResult.sampleItems.slice(0, 3).map((item, i) => (
                        <li key={i} className="text-green-700">
                          {item.isFiveStar ? '⭐' : '○'} {item.title}
                          {item.author && ` by ${item.author}`}
                          {item.rating && ` (${item.rating}★)`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-red-800">✗ {testResult.error || 'Failed to fetch feed'}</p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-[var(--color-red)]">{error}</p>}

        <Button type="submit" loading={loading} disabled={!label || !rssUrl}>
          Add Friend
        </Button>
      </form>
    </div>
  );
}
