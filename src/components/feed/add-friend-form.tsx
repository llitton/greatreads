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
    <div className="bg-white rounded-xl border border-[#e8e0d4] p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#fbf7ef] flex items-center justify-center text-2xl">
          👤
        </div>
        <div>
          <h3 className="font-serif font-bold text-[#1f1a17]">
            Add someone whose taste you trust
          </h3>
          <p className="text-sm text-[#8b7355] mt-0.5">
            We&apos;ll watch for their 5-star books
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-sm text-[#5b4a3f] underline underline-offset-2 hover:text-[#1f1a17] transition-colors"
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
          <div className="bg-[#fbf7ef] rounded-lg p-5 text-sm animate-fadeIn border border-[#e8e0d4]">
            <p className="font-medium text-[#1f1a17] mb-3">
              Finding a Goodreads feed URL:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-[#5b4a3f]">
              <li>Go to your friend&apos;s Goodreads profile</li>
              <li>Click &quot;Read&quot; under their bookshelves</li>
              <li>Look for the RSS icon at the bottom of the page</li>
              <li>Copy that URL and paste it here</li>
            </ol>
            <p className="mt-4 text-xs text-[#8b7355]">
              Format: goodreads.com/review/list_rss/[user_id]?shelf=read
            </p>
          </div>
        )}

        {/* Test results */}
        {testResult && (
          <div
            className={`rounded-lg p-5 text-sm animate-fadeIn ${
              testResult.success
                ? 'bg-[#4a7c59]/10 border border-[#4a7c59]/20'
                : 'bg-[#9c3d3d]/10 border border-[#9c3d3d]/20'
            }`}
          >
            {testResult.success ? (
              <>
                <p className="font-medium text-[#4a7c59] mb-3">
                  ✓ Found {testResult.fiveStarItems} five-star books!
                </p>
                {testResult.sampleItems.filter(i => i.isFiveStar).length > 0 && (
                  <div className="mt-3">
                    <p className="text-[#5b4a3f] text-xs mb-2">Recent 5-star picks:</p>
                    <ul className="space-y-1.5">
                      {testResult.sampleItems
                        .filter(i => i.isFiveStar)
                        .slice(0, 2)
                        .map((item, i) => (
                          <li key={i} className="text-[#5b4a3f] flex items-center gap-2">
                            <span className="text-[#d4a855]">★</span>
                            <span className="truncate">{item.title}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[#9c3d3d]">
                Couldn&apos;t read this feed. Check that the URL is correct.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-[#9c3d3d] bg-[#9c3d3d]/10 rounded-lg px-4 py-3">
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
