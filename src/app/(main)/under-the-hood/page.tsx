'use client';

import Link from 'next/link';

export default function UnderTheHoodPage() {
  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-2xl font-serif text-[#1f1a17] mb-6">
          How GreatReads decides what&apos;s worth your attention
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed">
          GreatReads is designed to surface as little as possible — and only when it matters.
          This isn&apos;t a feed optimized for discovery. It&apos;s a system built for trust.
        </p>
      </header>

      {/* Simple diagram */}
      <section className="mb-16 text-center">
        <div className="inline-flex items-baseline gap-8 text-sm">
          <div>
            <p className="font-medium text-[#1f1a17]">Signals</p>
            <p className="text-neutral-400 text-xs mt-1">moment</p>
          </div>
          <span className="text-neutral-300">→</span>
          <div>
            <p className="font-medium text-[#1f1a17]">My Books</p>
            <p className="text-neutral-400 text-xs mt-1">choice</p>
          </div>
          <span className="text-neutral-300">→</span>
          <div>
            <p className="font-medium text-[#1f1a17]">Canon</p>
            <p className="text-neutral-400 text-xs mt-1">commitment</p>
          </div>
        </div>
      </section>

      {/* What we deliberately ignore - moved up as a stance */}
      <section className="mb-16">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-6">
          What GreatReads deliberately ignores
        </h2>
        <div className="space-y-3 text-[15px]">
          <p className="text-neutral-600">
            <span className="text-neutral-400">Popularity</span> — Agreement isn&apos;t trust.
          </p>
          <p className="text-neutral-600">
            <span className="text-neutral-400">Averages</span> — Averages flatten taste.
          </p>
          <p className="text-neutral-600">
            <span className="text-neutral-400">Algorithms</span> — Trust isn&apos;t crowdsourced.
          </p>
          <p className="text-neutral-600">
            <span className="text-neutral-400">Reading streaks</span> — Reading isn&apos;t productivity.
          </p>
        </div>
      </section>

      {/* The three layers */}
      <section className="mb-8">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-6">
          The three layers
        </h2>
        <p className="text-sm text-neutral-500 mb-12">
          Each layer answers a different question. They&apos;re kept separate on purpose.
        </p>

        {/* Signals */}
        <div className="mb-12">
          <h3 className="text-lg font-medium text-[#1f1a17] mb-2">Signals</h3>
          <p className="text-sm text-neutral-500 italic mb-4">
            &ldquo;Someone I trust thought this was exceptional.&rdquo;
          </p>
          <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
            Signals are moments, not commitments. They&apos;re designed to interrupt briefly — and then get out of the way.
          </p>
          <p className="text-sm text-neutral-500">
            A signal appears only when someone in your circle gives a book five stars or adds it to their Top 10.
          </p>
        </div>

        {/* My Books */}
        <div className="mb-12">
          <h3 className="text-lg font-medium text-[#1f1a17] mb-2">My Books</h3>
          <p className="text-sm text-neutral-500 italic mb-4">
            &ldquo;This mattered enough to keep.&rdquo;
          </p>
          <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
            My Books is your personal library. A book enters only if you choose it — by saving a signal, importing your own reads, or adding it manually.
          </p>
          <p className="text-sm text-neutral-500">
            It doesn&apos;t assume you&apos;ll reread it, that it belongs in your canon, or that you owe it a decision.
          </p>
        </div>

        {/* Canon - given more weight */}
        <div className="mb-8 py-8 border-y border-neutral-100">
          <h3 className="text-xl font-medium text-[#1f1a17] mb-3">Canon</h3>
          <p className="text-sm text-neutral-500 italic mb-6">
            &ldquo;This shaped how I think.&rdquo;
          </p>
          <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
            A book cannot enter your canon unless it already lives in My Books and you&apos;ve written a reflection about why it stayed with you.
          </p>
          <p className="text-[15px] text-neutral-600 leading-relaxed mb-6">
            There are no shortcuts. No rankings. No auto-promotion. Your canon is limited to ten books because identity is limited too.
          </p>
          <p className="text-[15px] text-[#1f1a17] leading-relaxed">
            Canon is where taste turns into identity.
            <br />
            That&apos;s why it&apos;s slow. That&apos;s why it&apos;s limited. That&apos;s why it asks something of you.
          </p>
        </div>
      </section>

      {/* Why five stars matter */}
      <section className="mb-16">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          Why five stars matter here
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-3">
          Five stars here don&apos;t mean &ldquo;I liked this more than average.&rdquo;
        </p>
        <p className="text-[15px] text-[#1f1a17] leading-relaxed">
          They mean: &ldquo;I would interrupt someone else&apos;s reading life for this.&rdquo;
        </p>
      </section>

      {/* What Stayed means */}
      <section className="mb-16">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          What &ldquo;Stayed&rdquo; means
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-3">
          Some books don&apos;t announce themselves right away. They don&apos;t surface as signals. They don&apos;t rush into canon.
        </p>
        <p className="text-[15px] text-[#1f1a17] leading-relaxed mb-3">
          They linger.
        </p>
        <p className="text-sm text-neutral-500">
          Stayed exists for books that keep returning to your thoughts — driven by reflection and time, not ratings or recency.
        </p>
      </section>

      {/* Why quiet */}
      <section className="mb-16">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          Why the app feels quiet
        </h2>
        <p className="text-[15px] text-neutral-600 leading-relaxed mb-4">
          GreatReads is designed to allow inaction. Signals expire. Nothing auto-adds to your library. Canon changes require deliberate replacement.
        </p>
        <p className="text-sm text-neutral-500">
          You&apos;re never asked to keep up. If a book belongs, it will still belong later.
        </p>
      </section>

      {/* The rule */}
      <section className="mb-16">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-6">
          The rule everything follows
        </h2>
        <div className="space-y-2 mb-6">
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
          Every screen, rule, and constraint exists to keep those three from bleeding into each other.
        </p>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-neutral-100">
        <p className="text-[15px] text-neutral-500 leading-relaxed mb-8">
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
