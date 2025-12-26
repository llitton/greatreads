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

  // Dedication style - smaller, lighter, more like an inscription
  return (
    <div className="mb-12 animate-fadeIn">
      <div className="text-center max-w-md mx-auto relative">
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full text-neutral-300 hover:text-neutral-500 transition-colors text-sm"
          aria-label="Dismiss"
        >
          ×
        </button>

        <p className="text-[15px] text-neutral-500 leading-relaxed italic mb-3">
          &ldquo;This exists because I trust your taste.&rdquo;
        </p>

        <p className="text-xs text-neutral-400">
          — Laura
        </p>
      </div>
    </div>
  );
}
