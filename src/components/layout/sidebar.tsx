'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/feed', label: 'Feed', icon: '📚' },
  { href: '/my-books', label: 'My Books', icon: '📖' },
  { href: '/reflections', label: 'Stayed', icon: '💭' },
  { href: '/top10', label: 'Top 10', icon: '🏆' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const secondaryItems = [
  { href: '/under-the-hood', label: 'How It Works', icon: '◇' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 min-h-screen bg-[#faf8f5] border-r border-black/5 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-black/5">
        <Link href="/feed" className="flex items-center gap-3 no-underline group">
          <span className="text-2xl group-hover:scale-110 transition-transform">📚</span>
          <h1 className="text-lg font-bold text-[#1f1a17] font-serif">
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
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl no-underline transition-all text-sm ${
                    isActive
                      ? 'bg-white text-[#1f1a17] font-medium shadow-sm'
                      : 'text-neutral-500 hover:bg-white/50 hover:text-[#1f1a17]'
                  }`}
                >
                  <span className={`text-lg ${isActive ? '' : 'opacity-70'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Secondary nav */}
      <div className="px-4 pb-2">
        <ul className="space-y-1">
          {secondaryItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl no-underline transition-all text-xs ${
                    isActive
                      ? 'text-[#1f1a17]'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  <span className="text-sm opacity-50">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom decoration */}
      <div className="p-6 border-t border-black/5">
        <p className="text-xs text-neutral-400 text-center">
          Made with care
        </p>
      </div>
    </aside>
  );
}

// Mobile bottom nav
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 z-50 safe-area-inset-bottom">
      <ul className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 no-underline transition-colors ${
                  isActive
                    ? 'text-[#1f1a17]'
                    : 'text-neutral-400'
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
