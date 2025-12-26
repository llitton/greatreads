'use client';

import { ReactNode } from 'react';
import { Sidebar, MobileNav } from './sidebar';
import { TopBar } from './top-bar';

interface MainLayoutProps {
  children: ReactNode;
  showTopBar?: boolean;
  onAddFriend?: () => void;
}

export function MainLayout({ children, showTopBar = true, onAddFriend }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[var(--color-cream)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {showTopBar && <TopBar onAddFriend={onAddFriend} />}
        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
