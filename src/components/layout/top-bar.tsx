'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface TopBarProps {
  onAddFriend?: () => void;
}

export function TopBar({ onAddFriend }: TopBarProps) {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[var(--color-tan)]">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Logo - visible on mobile */}
        <Link href="/feed" className="flex items-center gap-2 no-underline lg:hidden">
          <span className="text-xl">📚</span>
          <span className="font-serif font-bold text-[var(--color-brown-dark)]">GreatReads</span>
        </Link>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Add Friend button */}
          {onAddFriend && (
            <button
              onClick={onAddFriend}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brown-dark)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-brown)] transition-colors"
            >
              <span className="hidden sm:inline">Add Friend</span>
              <span className="sm:hidden">+</span>
            </button>
          )}

          {/* Profile menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--color-parchment)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-parchment)] flex items-center justify-center text-sm font-medium text-[var(--color-brown-dark)]">
                {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
              </div>
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--color-tan)] py-1 z-20">
                  <div className="px-4 py-2 border-b border-[var(--color-tan)]">
                    <p className="text-sm font-medium text-[var(--color-brown-dark)] truncate">
                      {session?.user?.name || session?.user?.email}
                    </p>
                  </div>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-[var(--color-brown)] hover:bg-[var(--color-parchment)] no-underline"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--color-brown)] hover:bg-[var(--color-parchment)]"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
