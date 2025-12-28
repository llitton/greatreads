'use client';

import { ReactNode } from 'react';
import { SidebarContent, MobileNav } from './sidebar';
import { RightSidebar } from './right-sidebar';
import { TopBar } from './top-bar';

interface MainLayoutProps {
  children: ReactNode;
  showTopBar?: boolean;
  showRightSidebar?: boolean;
  onAddFriend?: () => void;
}

export function MainLayout({
  children,
  showTopBar = true,
  showRightSidebar = true,
  onAddFriend
}: MainLayoutProps) {
  return (
    <div className="h-screen bg-[#faf8f5] overflow-hidden">
      {/* Desktop: 3-column grid layout with isolated scroll zones */}
      <div className={`hidden lg:grid h-full ${
        showRightSidebar
          ? 'lg:grid-cols-[220px_1fr_300px]'
          : 'lg:grid-cols-[220px_1fr]'
      }`}>
        {/* Left nav - fixed, own scroll */}
        <aside className="h-full border-r border-black/5 bg-[#faf8f5] overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Main content area - scrolls independently */}
        <div className="h-full flex flex-col min-w-0 overflow-hidden">
          {showTopBar && <TopBar onAddFriend={onAddFriend} />}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              <div className="max-w-3xl mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>

        {/* Right sidebar - fixed, own scroll */}
        {showRightSidebar && (
          <aside className="h-full border-l border-black/5 overflow-hidden">
            <RightSidebar />
          </aside>
        )}
      </div>

      {/* Mobile: stacked layout (no right sidebar) */}
      <div className="lg:hidden h-full overflow-y-auto">
        {showTopBar && <TopBar onAddFriend={onAddFriend} />}
        <main className="p-6 pb-24">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
