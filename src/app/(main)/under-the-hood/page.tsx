'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function UnderTheHoodPage() {
  const [showDetails, setShowDetails] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* ═══════════════════════════════════════════════════════════════════
          ANCHOR - One sentence that captures everything
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-16">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-6">
          How GreatReads Works
        </h1>

        {/* The anchor */}
        <p className="text-lg text-[#1f1a17] leading-relaxed mb-3">
          GreatReads keeps only the strongest signals of taste.
          <br />
          Everything else is intentionally ignored.
        </p>

        {/* Expandable details */}
        <details className="group">
          <summary className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors list-none flex items-center gap-1.5">
            <span className="text-xs group-open:rotate-90 transition-transform">›</span>
            What does that mean?
          </summary>
          <div className="mt-4 pl-4 border-l-2 border-neutral-100 space-y-3 text-sm text-neutral-500 leading-relaxed">
            <p>Most reading apps optimize for engagement — more books, more activity, more time spent.</p>
            <p>GreatReads optimizes for trust. It shows you only what someone you chose to follow cared enough to signal as meaningful.</p>
            <p>The result: fewer books, but ones worth paying attention to.</p>
          </div>
        </details>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SIGNAL TIERS - Visual hierarchy by weight
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-2">
          What counts as a strong signal
        </h2>
        <p className="text-sm text-neutral-400 mb-8">
          From strongest to weakest — effort correlates with meaning.
        </p>

        {/* Top tier */}
        <div className="mb-8">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
            Highest weight
          </p>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-[#faf8f5] rounded-xl border border-[#f0ebe3]">
              <span className="text-xl flex-shrink-0 w-8">◆</span>
              <div>
                <p className="text-[15px] text-[#1f1a17] font-medium">Top 10 lists</p>
                <p className="text-sm text-neutral-500">Someone chose this over every other book they&apos;ve read.</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-[#faf8f5] rounded-xl border border-[#f0ebe3]">
              <span className="text-xl flex-shrink-0 w-8">✎</span>
              <div>
                <p className="text-[15px] text-[#1f1a17] font-medium">Written reflections</p>
                <p className="text-sm text-neutral-500">They didn&apos;t just finish it. They thought about it later.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Strong signals */}
        <div>
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
            Strong signals
          </p>
          <div className="space-y-3">
            <div className="flex gap-4 p-3 rounded-xl">
              <span className="text-lg flex-shrink-0 w-8 text-neutral-400">♥</span>
              <div>
                <p className="text-[15px] text-[#1f1a17] font-medium">Favorites</p>
                <p className="text-sm text-neutral-500">Books that stayed important even after the moment passed.</p>
              </div>
            </div>

            <div className="flex gap-4 p-3 rounded-xl">
              <span className="text-lg flex-shrink-0 w-8 text-amber-500">★</span>
              <div>
                <p className="text-[15px] text-[#1f1a17] font-medium">5-star ratings</p>
                <p className="text-sm text-neutral-500">Their highest possible endorsement.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHAT WE IGNORE - Axioms
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-2">
          What GreatReads ignores
        </h2>
        <p className="text-sm text-neutral-400 mb-8">
          These are intentional omissions, not missing features.
        </p>

        <div className="space-y-4">
          {[
            { title: 'Popularity', why: 'Popularity measures agreement. Resonance measures impact.' },
            { title: 'Algorithms based on strangers', why: 'Recommendations only come from people you choose to trust.' },
            { title: 'Average ratings', why: 'Averages flatten taste. Individual taste is the point.' },
            { title: 'Reading speed, streaks, or goals', why: 'This app treats reading as experience, not productivity.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <span className="text-neutral-300 flex-shrink-0 w-6">✗</span>
              <div>
                <p className="text-[15px] text-[#1f1a17] font-medium">{item.title}</p>
                <p className="text-sm text-neutral-500">{item.why}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Optimized for trust callout */}
        <div className="mt-10 bg-[#1f1a17] text-white rounded-xl p-6">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">
            Not optimized for
          </p>
          <p className="text-[15px] leading-relaxed text-white/80">
            Engagement · Daily usage · Completion · Growth loops
          </p>
          <p className="text-[15px] mt-3 text-white">
            Optimized for <span className="font-semibold">trust</span>.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          IMPORT - Framed as permissioned memory
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-2">
          How books get here
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          Import is the engine — but only with your permission.
        </p>

        <div className="bg-[#faf8f5] rounded-2xl p-6 border border-[#f0ebe3] mb-6">
          <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
            Importing tells GreatReads what mattered to you — nothing more.
          </p>
          <ul className="space-y-2 text-sm text-neutral-500">
            <li className="flex gap-2">
              <span className="text-neutral-400">→</span>
              No averages. No popularity. No recency bias.
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-400">→</span>
              Your 5-stars become visible to friends (if you choose)
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-400">→</span>
              Your favorites populate &ldquo;Stayed&rdquo;
            </li>
          </ul>
          <Link href="/import" className="inline-block mt-4 text-sm text-[#1f1a17] hover:underline">
            Import your library →
          </Link>
        </div>

        <p className="text-sm text-neutral-500 leading-relaxed">
          If someone you follow has read 40 books, you might see only one — or none — of them. That&apos;s intentional.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TIME MATTERS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-[#1f1a17] mb-4">
          Time matters
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed">
          Books can surface months or years after someone reads them — when they&apos;re still being thought about.
        </p>
        <p className="text-sm text-neutral-400 mt-3">
          GreatReads doesn&apos;t rush. It prefers older, meaningful signals over recent noise.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CLOSING
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16 text-center py-8 border-y border-black/5">
        <p className="text-[15px] text-neutral-600 leading-relaxed italic mb-4">
          If a book shows up here, it&apos;s because it earned its place.
        </p>
        <p className="text-sm text-neutral-500">
          The result is a small, quiet library you can trust.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MORE DETAILS (collapsible)
      ═══════════════════════════════════════════════════════════════════ */}
      <details className="mb-16 group">
        <summary className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors list-none flex items-center gap-1.5">
          <span className="text-xs group-open:rotate-90 transition-transform">›</span>
          Technical details
        </summary>
        <div className="mt-4 pl-4 border-l-2 border-neutral-100 space-y-3 text-sm text-neutral-500 leading-relaxed">
          <p>Data is updated periodically, not constantly.</p>
          <p>Nothing is shared publicly unless you choose to share it.</p>
          <p>Sources are polled daily for new five-star ratings.</p>
        </div>
      </details>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="pt-8 border-t border-black/5">
        <Link
          href="/feed"
          className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
        >
          ← Back to Signals
        </Link>

        {/* Meta note */}
        <p className="mt-12 text-xs text-neutral-300 text-center">
          This page exists for people who like to understand systems.
        </p>
      </footer>
    </div>
  );
}
