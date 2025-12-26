'use client';

import { useState, useEffect } from 'react';

interface WelcomeModuleProps {
  onSetupClick: () => void;
}

export function WelcomeModule({ onSetupClick }: WelcomeModuleProps) {
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

  return (
    <div
      className={`relative bg-gradient-to-br from-[#faf7f2] to-[#f5efe5] rounded-xl p-8 mb-8 border border-[#e8e0d4] shadow-sm transition-all duration-300 ${
        dismissed ? 'opacity-0 translate-y-2' : 'opacity-100'
      }`}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#8b7355] hover:bg-[#e8e0d4] hover:text-[#1f1a17] transition-colors"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>

      {/* Gift icon */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1f1a17] text-white text-2xl mb-6">
        🎁
      </div>

      {/* Content */}
      <h2 className="text-2xl font-serif font-bold text-[#1f1a17] mb-3">
        Made for Mark
      </h2>
      <p className="text-[#5b4a3f] mb-6 leading-relaxed text-[15px] max-w-lg">
        A tiny app that collects the 5-star books your friends loved.
        When someone you trust loves a book, you&apos;ll see it here.
      </p>

      {/* CTA */}
      <button
        onClick={onSetupClick}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1f1a17] text-white text-[15px] font-medium rounded-lg hover:bg-[#3d3530] transition-colors"
      >
        Set up my first friend
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </button>

      {/* Signature */}
      <p className="mt-6 text-sm text-[#8b7355] italic">
        — Laura
      </p>
    </div>
  );
}
