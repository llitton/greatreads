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
    <div className="flex min-h-screen bg-[#faf8f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {showTopBar && <TopBar onAddFriend={onAddFriend} />}
        <main className="flex-1 p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
