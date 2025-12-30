'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Discovery section
const discoveryItems = [
  { href: '/feed', label: 'Signals', icon: '✦' },
  { href: '/circle', label: 'Your Circle', icon: '👥' },
  { href: '/my-books', label: 'My Books', icon: '📚' },
];

// Reflection section
const reflectionItems = [
  { href: '/stayed', label: 'Stayed', icon: '💭' },
  { href: '/top10', label: 'Top 10', icon: '🏆' },
];

// Settings
const settingsItems = [
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const secondaryItems = [
  { href: '/import', label: 'Import', icon: '↑' },
  { href: '/under-the-hood', label: 'How It Works', icon: '◇' },
];

// Sidebar content (used inside layout's sticky aside)
export function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
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
        {/* Discovery section */}
        <div className="mb-6">
          <p className="px-4 mb-2 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
            Discovery
          </p>
          <ul className="space-y-1">
            {discoveryItems.map((item) => {
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
        </div>

        {/* Reflection section */}
        <div className="mb-6">
          <p className="px-4 mb-2 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
            Reflection
          </p>
          <ul className="space-y-1">
            {reflectionItems.map((item) => {
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
        </div>

        {/* Settings */}
        <ul className="space-y-1">
          {settingsItems.map((item) => {
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
    </div>
  );
}

// Mobile bottom nav - shows key items only
const mobileNavItems = [
  { href: '/feed', label: 'Signals', icon: '✦' },
  { href: '/my-books', label: 'My Books', icon: '📚' },
  { href: '/stayed', label: 'Stayed', icon: '💭' },
  { href: '/top10', label: 'Top 10', icon: '🏆' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 z-50 safe-area-inset-bottom">
      <ul className="flex justify-around items-center h-16">
        {mobileNavItems.map((item) => {
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
