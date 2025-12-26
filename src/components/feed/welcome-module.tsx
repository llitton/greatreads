'use client';

import { useState, useEffect } from 'react';

interface WelcomeModuleProps {
  onSetupClick: () => void;
}

export function WelcomeModule({ onSetupClick }: WelcomeModuleProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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

  return (
    <div
      className={`relative bg-white rounded-2xl p-8 mb-8 border border-black/5 shadow-sm transition-all duration-300 ${
        dismissed ? 'opacity-0 translate-y-2' : 'opacity-100'
      }`}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>

      <div className="flex items-start gap-6">
        {/* Gift icon */}
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#1f1a17] text-white text-2xl flex items-center justify-center">
          🎁
        </div>

        <div className="flex-1 min-w-0">
          {/* Content */}
          <h2 className="text-xl font-semibold text-[#1f1a17] mb-2">
            Made for Mark
          </h2>
          <p className="text-[15px] leading-6 text-neutral-600 mb-5 max-w-md">
            A tiny app that collects the 5-star books your friends loved.
            When someone you trust loves a book, you&apos;ll see it here.
          </p>

          {/* CTA */}
          <button
            onClick={onSetupClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1f1a17] text-white text-sm font-medium rounded-xl hover:bg-[#3d3530] transition-colors"
          >
            Set up my first friend
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 7h10M8 3l4 4-4 4" />
            </svg>
          </button>

          {/* Signature */}
          <p className="mt-4 text-sm text-neutral-400 italic">
            — Laura
          </p>
        </div>
      </div>
    </div>
  );
}
