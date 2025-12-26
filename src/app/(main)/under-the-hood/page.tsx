'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Literary Easter eggs - one appears each day
const literaryQuotes = [
  'Books are mirrors: you only see in them what you already have inside you.',
  'The books that matter most often take years to understand.',
  'A reader lives a thousand lives before he dies.',
  'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested.',
  'The best books are those that tell you what you already know.',
  'Reading is an act of civilization; it\'s one of the greatest acts of civilization.',
  'Books are a uniquely portable magic.',
];

export default function UnderTheHoodPage() {
  const [showMore, setShowMore] = useState(false);

  // Pick today's quote based on day of year
  const todaysQuote = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return literaryQuotes[dayOfYear % literaryQuotes.length];
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* ═══════════════════════════════════════════════════════════════════
          1. OPENING FRAMING - why this page exists
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-16">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-4">
          How GreatReads Works
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed mb-6">
          A short explanation of what&apos;s happening behind the scenes — without the noise.
        </p>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
          GreatReads is intentionally simple on the surface.
          Underneath, it&apos;s doing a few very specific things — and not doing many others — to keep recommendations meaningful.
        </p>
        <p className="text-sm text-neutral-400 italic">
          This page exists for people who like to understand systems, tradeoffs, and intent.
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          2. WHAT COUNTS AS A STRONG SIGNAL (ordered by weight)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-6">
          What counts as a strong signal
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
          GreatReads doesn&apos;t try to understand all reading behavior.
          It looks for a small number of signals that usually mean:
          <span className="italic"> &ldquo;This book mattered to me.&rdquo;</span>
        </p>
        <p className="text-sm text-neutral-400 mb-8">
          From strongest to weakest:
        </p>

        <div className="space-y-6">
          <div className="flex gap-4">
            <span className="text-lg flex-shrink-0 w-6">◆</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Top 10 lists</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Explicit, intentional choices — the strongest signal of all.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-lg flex-shrink-0 w-6">✎</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Written reflections</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                If someone took the time to write about a book, it likely stuck with them.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-lg flex-shrink-0 w-6">♥</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Favorites</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Books that stay important long after they&apos;re read. Count even if the rating is old.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-lg flex-shrink-0 w-6">★</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">5-star ratings</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                When someone gives a book their highest rating, that&apos;s a signal of impact.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-neutral-400 italic mt-8">
          The more effort a signal requires, the more weight it carries.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. WHAT THE APP IGNORES - as axioms
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-6">
          What GreatReads ignores on purpose
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-8">
          Many reading apps try to do too much.
          GreatReads is opinionated about what it leaves out.
        </p>

        <div className="space-y-6">
          <div className="flex gap-4">
            <span className="text-neutral-300 flex-shrink-0 w-6">✗</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Overall popularity</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Popularity measures agreement. GreatReads cares about resonance.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-neutral-300 flex-shrink-0 w-6">✗</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Algorithms based on strangers</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Recommendations only come from people you choose to trust.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-neutral-300 flex-shrink-0 w-6">✗</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Average ratings</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Averages flatten taste. GreatReads preserves it.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-neutral-300 flex-shrink-0 w-6">✗</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Reading speed, streaks, or goals</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                This app doesn&apos;t treat reading as productivity. Only as experience.
              </p>
            </div>
          </div>
        </div>

        {/* Not optimizing for callout */}
        <div className="mt-8 bg-neutral-50 rounded-xl p-5">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
            GreatReads is not optimized for
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Engagement · Daily usage · Completion · Growth loops
          </p>
          <p className="text-sm text-neutral-600 mt-2">
            It&apos;s optimized for <span className="font-medium">trust</span>.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TIME MATTERS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-6">
          Time matters
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
          GreatReads doesn&apos;t rush.
        </p>
        <p className="text-[15px] text-neutral-600 leading-relaxed">
          Books can surface months or years after someone reads them — when they&apos;re still being thought about. This connects directly to the &ldquo;Books that stayed with me&rdquo; philosophy.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. HOW BOOKS FLOW INTO YOUR FEED
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-6">
          How books show up here
        </h2>

        <div className="bg-neutral-50/50 rounded-2xl p-6 mb-6">
          <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
            GreatReads doesn&apos;t guess what mattered to you.
          </p>
          <p className="text-[15px] text-neutral-600 leading-relaxed">
            If you&apos;ve already taken the time to rate books elsewhere, you can bring that history with you — but only with your permission.
          </p>
        </div>

        {/* Import as engine */}
        <div className="bg-[#faf8f5] rounded-2xl p-6 mb-6 border border-[#f0ebe3]">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
            Import is the engine
          </p>
          <ul className="space-y-2 text-sm text-neutral-500 ml-4">
            <li>Export your Goodreads library as a CSV</li>
            <li>Import it into GreatReads</li>
            <li>Your 5-stars become visible to friends (if you choose)</li>
            <li>Your favorites populate &ldquo;Stayed With Me&rdquo;</li>
          </ul>
          <div className="mt-4">
            <a href="/import" className="text-sm text-[#1f1a17] hover:underline">
              Import your library →
            </a>
          </div>
        </div>

        {/* Concrete example */}
        <div className="bg-neutral-50/50 rounded-2xl p-6 border border-neutral-100">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
            Example
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            If someone you follow has read 40 books, you might see only one — or none — of them. That&apos;s intentional. Only the books that earned strong signals appear.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. WHY THIS EXISTS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-6">
          Why this exists
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
          This app exists because good recommendations don&apos;t come from volume — they come from taste.
        </p>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-8">
          The goal isn&apos;t to read more books.
          <br />
          It&apos;s to find the ones that quietly change how you think.
        </p>

        <p className="text-sm text-neutral-400 italic">
          — Laura
          <br />
          December 2025
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CLOSING LINE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16 text-center">
        <p className="text-[15px] text-neutral-600 leading-relaxed italic">
          If a book shows up here, it&apos;s because it earned its place.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. MORE CURIOUS? (COLLAPSIBLE)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <button
          onClick={() => setShowMore(!showMore)}
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-2"
        >
          <span className={`transition-transform ${showMore ? 'rotate-90' : ''}`}>›</span>
          If you&apos;re curious, a little more detail
        </button>

        {showMore && (
          <div className="mt-6 pl-4 border-l-2 border-neutral-100 space-y-4 animate-fadeIn">
            <p className="text-sm text-neutral-500 leading-relaxed">
              Data is updated periodically, not constantly.
            </p>
            <p className="text-sm text-neutral-500 leading-relaxed">
              The app prefers older, meaningful signals over recent noise.
            </p>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Nothing is shared publicly unless you choose to share it.
            </p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="pt-8 border-t border-black/5">
        <Link
          href="/feed"
          className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
        >
          ← Back to Feed
        </Link>

        {/* Literary Easter egg - changes daily */}
        <p className="mt-12 text-xs text-neutral-300 italic text-center leading-relaxed">
          &ldquo;{todaysQuote}&rdquo;
        </p>
      </footer>
    </div>
  );
}
