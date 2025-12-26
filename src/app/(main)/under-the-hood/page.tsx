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
          1. OPENING FRAMING
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-16">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-4">
          How GreatReads Works
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed mb-8">
          A short explanation of what&apos;s happening behind the scenes — without the noise.
        </p>
        <p className="text-[15px] text-neutral-600 leading-relaxed">
          GreatReads is intentionally simple on the surface.
          Underneath, it&apos;s doing a few very specific things — and not doing many others — to keep recommendations meaningful.
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          2. WHAT COUNTS AS A STRONG SIGNAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-6">
          What counts as a strong signal
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-8">
          GreatReads doesn&apos;t try to understand all reading behavior.
          It looks for a small number of signals that usually mean:
          <span className="italic"> &ldquo;This book mattered to me.&rdquo;</span>
        </p>

        <div className="space-y-6">
          <div className="flex gap-4">
            <span className="text-lg flex-shrink-0 w-6">★</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">5-star ratings</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                When someone gives a book their highest rating, that&apos;s a strong signal of impact.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-lg flex-shrink-0 w-6">♥</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Favorites</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Some books stay important long after they&apos;re read. Favorites count even if the rating is old.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-lg flex-shrink-0 w-6">✎</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Reflections or notes</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                If someone took the time to write about a book, it likely stuck with them.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-lg flex-shrink-0 w-6">◆</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Top 10 lists</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                These are explicit, intentional choices — the strongest signal of all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. WHAT THE APP IGNORES
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
                A book being widely liked doesn&apos;t mean you would like it.
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
                A 4.2 average from 300,000 readers is less meaningful than one person you respect saying, &ldquo;This stayed with me.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-neutral-300 flex-shrink-0 w-6">✗</span>
            <div>
              <p className="text-[15px] text-[#1f1a17] font-medium mb-1">Reading speed, streaks, or goals</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                This app isn&apos;t trying to optimize reading as a habit — only as an experience.
              </p>
            </div>
          </div>
        </div>
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
            When you follow someone:
          </p>
          <ul className="space-y-2 text-sm text-neutral-500 ml-4">
            <li>GreatReads looks at their strongest signals — favorites, 5-stars, reflections.</li>
            <li>It filters out everything else.</li>
            <li>It quietly waits for new signals over time.</li>
          </ul>
        </div>

        <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100/50">
          <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
            If nothing appears yet, that usually means one of two things:
          </p>
          <ul className="space-y-2 text-sm text-neutral-500 ml-4">
            <li>Their favorite books are older, and still being surfaced</li>
            <li>They haven&apos;t marked many books as &ldquo;loved&rdquo; yet</li>
          </ul>
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
