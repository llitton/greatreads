'use client';

import Link from 'next/link';

export default function UnderTheHoodPage() {
  return (
    <div className="max-w-lg mx-auto px-5 py-12">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-2xl font-serif text-[#1f1a17] mb-6 leading-snug">
          How GreatReads decides what&apos;s worth your attention
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed">
          GreatReads is designed to surface as little as possible — and only when it matters.
          This isn&apos;t a feed optimized for discovery. It&apos;s a system built for trust.
        </p>
      </header>

      {/* Visual anchor: the diagram */}
      <section className="mb-16 py-8 border-y border-neutral-100">
        <div className="flex items-start justify-center gap-6 sm:gap-10">
          <div className="text-center">
            <p className="text-base font-medium text-[#1f1a17] mb-1">Signals</p>
            <p className="text-xs text-neutral-400">moment</p>
          </div>
          <span className="text-neutral-200 text-lg mt-1">→</span>
          <div className="text-center">
            <p className="text-base font-medium text-[#1f1a17] mb-1">My Books</p>
            <p className="text-xs text-neutral-400">choice</p>
          </div>
          <span className="text-neutral-200 text-lg mt-1">→</span>
          <div className="text-center">
            <p className="text-base font-medium text-[#1f1a17] mb-1">Canon</p>
            <p className="text-xs text-neutral-400">commitment</p>
          </div>
        </div>
      </section>

      {/* What we deliberately ignore - callout block */}
      <section className="mb-16 -mx-2 px-5 py-6 bg-neutral-50/70 rounded-xl">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-5">
          What GreatReads deliberately ignores
        </h2>
        <div className="space-y-2.5">
          <p className="text-[15px] text-neutral-600">
            <span className="text-neutral-400">Popularity</span> — Agreement isn&apos;t trust.
          </p>
          <p className="text-[15px] text-neutral-600">
            <span className="text-neutral-400">Averages</span> — Averages flatten taste.
          </p>
          <p className="text-[15px] text-neutral-600">
            <span className="text-neutral-400">Algorithms</span> — Trust isn&apos;t crowdsourced.
          </p>
          <p className="text-[15px] text-neutral-600">
            <span className="text-neutral-400">Reading streaks</span> — Reading isn&apos;t productivity.
          </p>
        </div>
      </section>

      {/* Divider before mechanics */}
      <div className="mb-12">
        <div className="h-px bg-neutral-100" />
      </div>

      {/* The three layers */}
      <section className="mb-16">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
          The three layers
        </h2>
        <p className="text-sm text-neutral-500 mb-10">
          Each answers a different question. They&apos;re kept separate on purpose.
        </p>

        {/* Signals */}
        <div className="mb-10">
          <h3 className="text-lg font-medium text-[#1f1a17] mb-2">Signals</h3>
          <p className="text-sm text-neutral-500 italic mb-3">
            &ldquo;Someone I trust thought this was exceptional.&rdquo;
          </p>
          <p className="text-[15px] text-neutral-600 leading-relaxed">
            Signals are moments, not commitments. They appear when someone in your circle gives a book five stars or adds it to their Top 10 — then get out of the way.
          </p>
        </div>

        {/* My Books */}
        <div className="mb-10">
          <h3 className="text-lg font-medium text-[#1f1a17] mb-2">My Books</h3>
          <p className="text-sm text-neutral-500 italic mb-3">
            &ldquo;This mattered enough to keep.&rdquo;
          </p>
          <p className="text-[15px] text-neutral-600 leading-relaxed">
            Your personal library. A book enters only if you choose it. It doesn&apos;t assume you&apos;ll reread it, that it belongs in your canon, or that you owe it a decision.
          </p>
        </div>

        {/* Canon - heavier treatment */}
        <div className="pl-4 border-l-2 border-[#1f1a17]/20">
          <h3 className="text-xl font-medium text-[#1f1a17] mb-2">Canon</h3>
          <p className="text-sm text-neutral-500 italic mb-4">
            &ldquo;This shaped how I think.&rdquo;
          </p>
          <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
            A book cannot enter your canon unless it already lives in My Books and you&apos;ve written a reflection about why it stayed with you. No shortcuts. No auto-promotion.
          </p>
          <p className="text-[15px] text-[#1f1a17] leading-relaxed">
            Canon is where taste turns into identity. That&apos;s why it&apos;s slow. That&apos;s why it&apos;s limited. That&apos;s why it asks something of you.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="mb-12">
        <div className="h-px bg-neutral-100" />
      </div>

      {/* Why five stars matter */}
      <section className="mb-12">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          Why five stars matter here
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-2">
          Five stars don&apos;t mean &ldquo;I liked this more than average.&rdquo;
        </p>
        <p className="text-[15px] text-[#1f1a17] leading-relaxed">
          They mean: &ldquo;I would interrupt someone else&apos;s reading life for this.&rdquo;
        </p>
      </section>

      {/* What Stayed means */}
      <section className="mb-12">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          What &ldquo;Stayed&rdquo; means
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-2">
          Some books don&apos;t announce themselves right away. They don&apos;t rush into canon.
        </p>
        <p className="text-[15px] text-[#1f1a17] leading-relaxed">
          They linger.
        </p>
      </section>

      {/* Why quiet */}
      <section className="mb-12">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          Why the app feels quiet
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed">
          Signals expire. Nothing auto-adds. Canon requires deliberate replacement. If a book belongs, it will still belong later.
        </p>
      </section>

      {/* Divider */}
      <div className="mb-12">
        <div className="h-px bg-neutral-100" />
      </div>

      {/* The rule */}
      <section className="mb-16">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-5">
          The rule everything follows
        </h2>
        <div className="space-y-1.5 mb-5">
          <p className="text-[15px] text-[#1f1a17]">
            <span className="font-medium">Signals</span> are suggestions.
          </p>
          <p className="text-[15px] text-[#1f1a17]">
            <span className="font-medium">My Books</span> are choices.
          </p>
          <p className="text-[15px] text-[#1f1a17]">
            <span className="font-medium">Canon</span> is commitment.
          </p>
        </div>
        <p className="text-sm text-neutral-500">
          Every screen exists to keep those three from bleeding into each other.
        </p>
      </section>

      {/* Footer - clear visual full stop */}
      <footer className="pt-10 border-t border-neutral-100">
        <p className="text-[15px] text-[#1f1a17] leading-relaxed mb-10">
          If a book appears here, it earned its place — slowly, deliberately, and without needing consensus.
        </p>
        <Link
          href="/feed"
          className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
        >
          ← Back to Signals
        </Link>
      </footer>
    </div>
  );
}
