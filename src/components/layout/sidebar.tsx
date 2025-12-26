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
    <aside className="hidden lg:flex w-56 min-h-screen bg-[#fbf7ef] border-r border-[#e8e0d4] flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#e8e0d4]">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg no-underline transition-all text-[15px] leading-6 ${
                    isActive
                      ? 'bg-white/80 text-[#1f1a17] font-semibold shadow-sm border border-black/5'
                      : 'text-[#5b4a3f] hover:bg-white/50 hover:text-[#1f1a17]'
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

      {/* Bottom decoration */}
      <div className="p-6 border-t border-[#e8e0d4]">
        <p className="text-xs text-[#8b7355] text-center">
          Your reading companion
        </p>
      </div>
    </aside>
  );
}

// Mobile bottom nav
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e0d4] z-50 safe-area-inset-bottom">
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
                    : 'text-[#8b7355]'
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
