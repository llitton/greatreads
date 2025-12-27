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
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Desktop: 3-column grid layout */}
      <div className={`hidden lg:grid lg:gap-0 ${
        showRightSidebar
          ? 'lg:grid-cols-[220px_1fr_300px]'
          : 'lg:grid-cols-[220px_1fr]'
      }`}>
        {/* Left nav - sticky */}
        <aside className="sticky top-0 self-start h-screen border-r border-black/5 bg-[#faf8f5]">
          <SidebarContent />
        </aside>

        {/* Main content area */}
        <div className="min-w-0 flex flex-col">
          {showTopBar && <TopBar onAddFriend={onAddFriend} />}
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Right sidebar - sticky, ambient RSS */}
        {showRightSidebar && (
          <aside className="sticky top-0 self-start h-screen border-l border-black/5 bg-[#fdfcfa] overflow-y-auto">
            <RightSidebar />
          </aside>
        )}
      </div>

      {/* Mobile: stacked layout (no right sidebar) */}
      <div className="lg:hidden">
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
