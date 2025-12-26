'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'greatreads_welcome_dismissed';

export function WelcomeMessage() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  // Don't render on server or if already dismissed
  if (!mounted || !show) {
    return null;
  }

  return (
    <div className="mb-10 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-neutral-500 hover:bg-neutral-50 transition-all"
          aria-label="Dismiss"
        >
          ×
        </button>

        <p className="text-[17px] text-[#1f1a17] leading-relaxed mb-6">
          I made this because I trust your taste — and I wanted a place where it mattered.
        </p>

        <p className="text-sm text-neutral-400 italic">
          — Laura
        </p>
      </div>
    </div>
  );
}
