'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const navItems = [
  { href: '/feed', label: 'Feed', icon: '📚' },
  { href: '/my-books', label: 'My Books', icon: '📖' },
  { href: '/top10', label: 'Top 10', icon: '🏆' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-[var(--color-tan)] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--color-tan)]">
        <Link href="/feed" className="flex items-center gap-2 no-underline">
          <span className="text-2xl">📚</span>
          <h1 className="text-xl font-bold text-[var(--color-brown-dark)] font-serif">
            GreatReads
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg no-underline transition-colors ${
                    isActive
                      ? 'bg-[var(--color-parchment)] text-[var(--color-brown-dark)] font-medium'
                      : 'text-[var(--color-brown)] hover:bg-[var(--color-parchment)]'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-[var(--color-tan)]">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-parchment)] flex items-center justify-center text-sm">
            {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-brown-dark)] truncate">
              {session?.user?.name || session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full mt-2 px-4 py-2 text-sm text-[var(--color-brown)] hover:bg-[var(--color-parchment)] rounded-lg transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
