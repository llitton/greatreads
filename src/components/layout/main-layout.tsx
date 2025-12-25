'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
}

export function MainLayout({ children, rightSidebar }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
      {rightSidebar && (
        <aside className="w-80 min-h-screen bg-white border-l border-[var(--color-tan)] p-6 hide-mobile">
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}
