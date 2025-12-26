'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/feed', label: 'Feed', icon: '📚' },
  { href: '/my-books', label: 'My Books', icon: '📖' },
  { href: '/top10', label: 'Top 10', icon: '🏆' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 min-h-screen bg-white border-r border-[var(--color-tan)] flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-[var(--color-tan)]">
        <Link href="/feed" className="flex items-center gap-2.5 no-underline group">
          <span className="text-2xl group-hover:scale-110 transition-transform">📚</span>
          <h1 className="text-lg font-bold text-[var(--color-brown-dark)] font-serif">
            GreatReads
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline transition-all ${
                    isActive
                      ? 'bg-[var(--color-brown-dark)] text-white shadow-sm'
                      : 'text-[var(--color-brown)] hover:bg-[var(--color-parchment)]'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom decoration */}
      <div className="p-4 border-t border-[var(--color-tan)]">
        <div className="text-center">
          <p className="text-xs text-[var(--color-brown-light)]">
            Your reading companion
          </p>
        </div>
      </div>
    </aside>
  );
}

// Mobile bottom nav
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-tan)] z-50 safe-area-inset-bottom">
      <ul className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 no-underline transition-colors ${
                  isActive
                    ? 'text-[var(--color-brown-dark)]'
                    : 'text-[var(--color-brown-light)]'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
