'use client';

import { useState, useEffect } from 'react';

interface WelcomeModuleProps {
  userName?: string;
  onSetupClick: () => void;
}

export function WelcomeModule({ userName, onSetupClick }: WelcomeModuleProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('welcomeModuleDismissed');
    if (!wasDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('welcomeModuleDismissed', 'true');
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  const displayName = userName || 'there';

  return (
    <div
      className={`relative bg-gradient-to-br from-[#faf7f2] to-[#f5efe5] rounded-xl p-6 mb-6 border border-[var(--color-tan)] shadow-sm transition-all duration-300 ${
        dismissed ? 'opacity-0 translate-y-2' : 'opacity-100'
      }`}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-[var(--color-brown-light)] hover:bg-[var(--color-tan)] hover:text-[var(--color-brown-dark)] transition-colors"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>

      {/* Gift icon */}
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-brown-dark)] text-white text-xl mb-4">
        🎁
      </div>

      {/* Content */}
      <h2 className="text-xl font-serif font-bold text-[var(--color-brown-dark)] mb-2">
        Made for {displayName}
      </h2>
      <p className="text-[var(--color-brown)] mb-4 leading-relaxed">
        I built this to collect 5-star books from the people you follow.
        When someone you trust loves a book, you&apos;ll see it here.
      </p>

      {/* CTA */}
      <button
        onClick={onSetupClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-brown-dark)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-brown)] transition-colors"
      >
        Set up my first friend
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </button>

      {/* Signature */}
      <p className="mt-4 text-sm text-[var(--color-brown-light)] italic">
        — Laura
      </p>
    </div>
  );
}
