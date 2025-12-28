'use client';

import Link from 'next/link';

export default function UnderTheHoodPage() {
  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER: The Principle + Orienting subtitle
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-8 text-center">
        <h1 className="text-xl text-[#1f1a17] leading-relaxed mb-2">
          GreatReads keeps only the strongest signals of taste.
        </h1>
        <p className="text-sm text-neutral-400">
          This page explains why some books surface here and most never will.
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SIGNAL HIERARCHY: Visual gradient from strongest to weakest
          Uses a left-side "strength rail" to show the system
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <p className="text-[10px] text-neutral-300 uppercase tracking-widest mb-5">
          Signal strength
        </p>

        {/* Container with strength rail on the left */}
        <div className="relative pl-5">
          {/* The strength rail - gradient line that thins as it descends */}
          <div className="absolute left-0 top-0 bottom-0 w-1">
            <div className="absolute top-0 w-1 h-1/4 bg-[#1f1a17] rounded-full" />
            <div className="absolute top-1/4 w-0.5 h-1/4 bg-[#4a453f] rounded-full left-0.5" style={{ left: '1px' }} />
            <div className="absolute top-2/4 w-0.5 h-1/4 bg-neutral-300 rounded-full" style={{ left: '1px' }} />
            <div className="absolute top-3/4 w-px h-1/4 bg-neutral-200 rounded-full" style={{ left: '2px' }} />
          </div>

          <div className="space-y-3">
            {/* Highest weight - largest, boldest */}
            <div className="bg-[#faf8f5] rounded-xl p-5 border-l-4 border-[#1f1a17]">
              <div className="flex items-start gap-4">
                <span className="text-xl">◆</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-semibold text-[#1f1a17]">Top 10 lists</p>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wide">Highest weight</span>
                  </div>
                  <p className="text-sm text-neutral-500">
                    Someone chose this over every other book they&apos;ve read.
                  </p>
                </div>
              </div>
            </div>

            {/* Strong - slightly smaller */}
            <div className="bg-[#faf8f5] rounded-xl p-4 border-l-2 border-[#4a453f]">
              <div className="flex items-start gap-4">
                <span className="text-lg text-neutral-600">✎</span>
                <div>
                  <p className="text-[15px] font-medium text-[#1f1a17] mb-0.5">Written reflections</p>
                  <p className="text-sm text-neutral-500">
                    They didn&apos;t just finish it. They thought about it later.
                  </p>
                </div>
              </div>
            </div>

            {/* Medium - lighter treatment */}
            <div className="bg-neutral-50/50 rounded-lg p-4 border-l border-neutral-300">
              <div className="flex items-start gap-4">
                <span className="text-lg text-rose-300">♥</span>
                <div>
                  <p className="text-sm font-medium text-neutral-700">Favorites</p>
                  <p className="text-sm text-neutral-400">
                    Books that stayed important after the moment passed.
                  </p>
                </div>
              </div>
            </div>

            {/* Lower weight - most compact */}
            <div className="bg-neutral-50/30 rounded-lg p-3 pl-4">
              <div className="flex items-center gap-3">
                <span className="text-base text-amber-300">★</span>
                <div>
                  <p className="text-sm text-neutral-600">
                    <span className="font-medium">5-star ratings</span>
                    <span className="text-neutral-400 ml-2">Their highest possible endorsement.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          THE CORE BELIEF: Optimized for trust
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-8 py-5 text-center">
        <p className="text-neutral-500 mb-1">
          GreatReads is not optimized for engagement.
        </p>
        <p className="text-lg font-medium text-[#1f1a17]">
          It&apos;s optimized for trust.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          THE REFUSAL: Manifesto, not footnote
          Elevated with its own container, sharper language
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-8 bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
        <h2 className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-5">
          What we refuse to optimize for
        </h2>

        <div className="space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="text-red-400 font-medium">✗</span>
            <p className="text-[15px] text-[#1f1a17]">
              <span className="font-medium">Popularity</span>
              <span className="text-neutral-400 ml-1">— Agreement isn&apos;t impact.</span>
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-red-400 font-medium">✗</span>
            <p className="text-[15px] text-[#1f1a17]">
              <span className="font-medium">Algorithms based on strangers</span>
              <span className="text-neutral-400 ml-1">— Trust isn&apos;t crowdsourced.</span>
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-red-400 font-medium">✗</span>
            <p className="text-[15px] text-[#1f1a17]">
              <span className="font-medium">Average ratings</span>
              <span className="text-neutral-400 ml-1">— Averages flatten taste.</span>
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-red-400 font-medium">✗</span>
            <p className="text-[15px] text-[#1f1a17]">
              <span className="font-medium">Reading speed, streaks, or goals</span>
              <span className="text-neutral-400 ml-1">— Reading is experience, not productivity.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CLOSING: Strong return path
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="pt-8 border-t border-neutral-100 text-center">
        <p className="text-sm text-neutral-500 mb-5">
          If a book appears here, it earned its place.
        </p>

        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#1f1a17] bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
        >
          <span>←</span>
          <span>Back to Signals</span>
        </Link>
      </footer>
    </div>
  );
}
