'use client';

import Link from 'next/link';

export default function UnderTheHoodPage() {
  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-2xl font-serif text-[#1f1a17] mb-4">
          How GreatReads decides what&apos;s worth your attention
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed mb-3">
          GreatReads is designed to surface as little as possible — and only when it matters.
        </p>
        <p className="text-[15px] text-neutral-500 leading-relaxed mb-3">
          Most books you encounter here will never trend, spike, or circulate widely. That&apos;s intentional.
        </p>
        <p className="text-[15px] text-neutral-500 leading-relaxed">
          This isn&apos;t a feed optimized for discovery. It&apos;s a system built for trust.
        </p>
      </header>

      {/* The three layers */}
      <section className="mb-12">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-6">
          The three layers of GreatReads
        </h2>
        <p className="text-sm text-neutral-500 mb-8">
          GreatReads keeps reading signals separate on purpose. Each layer answers a different question.
        </p>

        {/* Signals */}
        <div className="mb-8 p-5 bg-[#fdfcfa] rounded-xl border border-[#f0ebe3]">
          <h3 className="text-lg font-medium text-[#1f1a17] mb-2">Signals</h3>
          <p className="text-sm text-neutral-500 italic mb-4">
            &ldquo;Someone I trust thought this was exceptional.&rdquo;
          </p>
          <p className="text-sm text-neutral-600 mb-3">
            Signals are moments, not commitments.
          </p>
          <p className="text-sm text-neutral-500 mb-3">
            A signal appears only when someone in your circle:
          </p>
          <ul className="text-sm text-neutral-500 mb-4 ml-4 space-y-1">
            <li>• gives a book five stars, or</li>
            <li>• adds it to their Top 10 canon</li>
          </ul>
          <p className="text-sm text-neutral-500 mb-2">Signals:</p>
          <ul className="text-sm text-neutral-400 ml-4 space-y-1">
            <li>• are rare by design</li>
            <li>• can be ignored without consequence</li>
            <li>• fade instead of accumulating</li>
          </ul>
          <p className="text-sm text-neutral-500 mt-4">
            Nothing becomes &ldquo;yours&rdquo; at this stage. Signals exist to interrupt you briefly — not to persuade you.
          </p>
        </div>

        {/* My Books */}
        <div className="mb-8 p-5 bg-[#fdfcfa] rounded-xl border border-[#f0ebe3]">
          <h3 className="text-lg font-medium text-[#1f1a17] mb-2">My Books</h3>
          <p className="text-sm text-neutral-500 italic mb-4">
            &ldquo;This mattered enough to keep.&rdquo;
          </p>
          <p className="text-sm text-neutral-600 mb-3">
            My Books is your personal library.
          </p>
          <p className="text-sm text-neutral-500 mb-3">
            A book enters My Books only if you choose it:
          </p>
          <ul className="text-sm text-neutral-500 mb-4 ml-4 space-y-1">
            <li>• you save a signal</li>
            <li>• you import your own five-star reads</li>
            <li>• you add it manually</li>
          </ul>
          <p className="text-sm text-neutral-500 mb-2">My Books does not assume:</p>
          <ul className="text-sm text-neutral-400 ml-4 space-y-1">
            <li>• that you&apos;ll reread it</li>
            <li>• that it belongs in your canon</li>
            <li>• that you owe it a decision</li>
          </ul>
          <p className="text-sm text-neutral-500 mt-4">
            It&apos;s simply where books go when they&apos;ve earned your attention — but not yet your judgment.
          </p>
        </div>

        {/* Canon */}
        <div className="mb-8 p-5 bg-[#fdfcfa] rounded-xl border border-[#f0ebe3]">
          <h3 className="text-lg font-medium text-[#1f1a17] mb-2">Canon (Top 10)</h3>
          <p className="text-sm text-neutral-500 italic mb-4">
            &ldquo;This shaped how I think.&rdquo;
          </p>
          <p className="text-sm text-neutral-600 mb-3">
            Canon is different.
          </p>
          <p className="text-sm text-neutral-500 mb-3">
            A book cannot enter your canon unless:
          </p>
          <ul className="text-sm text-neutral-500 mb-4 ml-4 space-y-1">
            <li>• it already lives in My Books, and</li>
            <li>• you&apos;ve written a reflection about why it stayed with you</li>
          </ul>
          <p className="text-sm text-neutral-500 mb-3">
            There are no shortcuts. No rankings. No auto-promotion.
          </p>
          <p className="text-sm text-neutral-500">
            Your canon is limited to ten books because identity is limited too.
            It&apos;s meant to be revisited — and occasionally revised — but never churned.
          </p>
        </div>
      </section>

      {/* Why five stars matter */}
      <section className="mb-12">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          Why five stars matter here
        </h2>
        <p className="text-sm text-neutral-500 mb-3">
          GreatReads treats ratings differently than most reading apps.
        </p>
        <p className="text-sm text-neutral-500 mb-3">
          Five stars here don&apos;t mean:
        </p>
        <p className="text-sm text-neutral-400 ml-4 mb-4">
          &ldquo;I liked this more than average.&rdquo;
        </p>
        <p className="text-sm text-neutral-500 mb-3">
          They mean:
        </p>
        <p className="text-sm text-neutral-600 ml-4 mb-4 font-medium">
          &ldquo;I would interrupt someone else&apos;s reading life for this.&rdquo;
        </p>
        <p className="text-sm text-neutral-400">
          Anything less may still be good. It just isn&apos;t a signal.
        </p>
      </section>

      {/* What we refuse */}
      <section className="mb-12">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          Why you won&apos;t find popularity, averages, or algorithms
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          GreatReads refuses to optimize for:
        </p>
        <ul className="text-sm text-neutral-500 mb-4 ml-4 space-y-1">
          <li>• popularity</li>
          <li>• average ratings</li>
          <li>• engagement metrics</li>
          <li>• reading streaks, goals, or speed</li>
        </ul>
        <p className="text-sm text-neutral-500 mb-4">
          Those systems reward volume and consensus. They flatten taste.
        </p>
        <p className="text-sm text-neutral-500 mb-3">
          Instead, GreatReads optimizes for:
        </p>
        <ul className="text-sm text-neutral-600 mb-4 ml-4 space-y-1">
          <li>• who you trust</li>
          <li>• what they truly endorsed</li>
          <li>• what you chose to keep</li>
        </ul>
        <p className="text-sm text-neutral-500">
          If a book appears here, it wasn&apos;t boosted. It earned its place.
        </p>
      </section>

      {/* What Stayed means */}
      <section className="mb-12">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          What &ldquo;Stayed&rdquo; means
        </h2>
        <p className="text-sm text-neutral-500 mb-3">
          Some books don&apos;t announce themselves right away.
        </p>
        <p className="text-sm text-neutral-500 mb-3">
          They don&apos;t surface as signals. They don&apos;t rush into canon.
        </p>
        <p className="text-sm text-neutral-600 mb-4 font-medium">
          They linger.
        </p>
        <p className="text-sm text-neutral-500 mb-3">
          Stayed exists for books that keep returning to your thoughts — sometimes long after you&apos;ve finished reading them.
        </p>
        <p className="text-sm text-neutral-400">
          This isn&apos;t driven by ratings or recency. It&apos;s driven by reflection and time.
        </p>
      </section>

      {/* Why quiet */}
      <section className="mb-12">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          Why the app feels quiet
        </h2>
        <p className="text-sm text-neutral-500 mb-3">
          GreatReads is designed to allow inaction.
        </p>
        <ul className="text-sm text-neutral-500 mb-4 ml-4 space-y-1">
          <li>• Signals expire.</li>
          <li>• Nothing auto-adds to your library.</li>
          <li>• Canon changes require deliberate replacement, not reordering.</li>
        </ul>
        <p className="text-sm text-neutral-500 mb-3">
          You&apos;re never asked to keep up. You&apos;re never nudged to decide quickly.
        </p>
        <p className="text-sm text-neutral-400">
          If a book belongs, it will still belong later.
        </p>
      </section>

      {/* The rule */}
      <section className="mb-12 p-6 bg-neutral-50 rounded-xl border border-neutral-100">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
          The rule everything follows
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          If you remember one thing about how GreatReads works, let it be this:
        </p>
        <div className="space-y-2 mb-4">
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
          Every screen, rule, and constraint in the app exists to keep those three from bleeding into each other.
        </p>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-neutral-100 text-center">
        <p className="text-sm text-neutral-500 italic mb-6">
          If a book appears here, it earned its place.
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
