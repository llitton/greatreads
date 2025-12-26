'use client';

import { useState } from 'react';

interface ShelfBook {
  title: string;
  author: string;
  color: string;
  textColor: string;
}

const marksFavorites: ShelfBook[] = [
  {
    title: 'White Fragility',
    author: 'Robin DiAngelo',
    color: '#f5f5f5',
    textColor: '#1f1a17',
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    color: '#1f1a17',
    textColor: '#ffffff',
  },
  {
    title: 'The Art of Happiness',
    author: 'Dalai Lama',
    color: '#d4a855',
    textColor: '#1f1a17',
  },
];

interface MarksShelfProps {
  onAddToBooks?: (title: string) => void;
}

export function MarksShelf({ onAddToBooks }: MarksShelfProps) {
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xl">📚</span>
        <div>
          <h2 className="font-semibold text-[#1f1a17]">Mark&apos;s Favorites</h2>
          <p className="text-sm text-neutral-500">Books that shaped how Mark thinks</p>
        </div>
      </div>

      {/* Shelf */}
      <div className="relative">
        {/* Books container */}
        <div className="flex gap-3 pb-4">
          {marksFavorites.map((book) => (
            <button
              key={book.title}
              onClick={() => onAddToBooks?.(book.title)}
              onMouseEnter={() => setHoveredBook(book.title)}
              onMouseLeave={() => setHoveredBook(null)}
              className="group relative flex-shrink-0 transition-transform hover:-translate-y-1"
            >
              {/* Book spine */}
              <div
                className="w-12 h-40 rounded-sm shadow-md flex flex-col justify-between py-3 px-1.5 border-l-[3px] transition-shadow hover:shadow-lg"
                style={{
                  backgroundColor: book.color,
                  borderLeftColor: book.color === '#f5f5f5' ? '#e0e0e0' : 'rgba(0,0,0,0.15)',
                }}
              >
                {/* Title (vertical) */}
                <div
                  className="text-[9px] font-medium leading-tight overflow-hidden"
                  style={{
                    color: book.textColor,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)',
                  }}
                >
                  {book.title}
                </div>

                {/* Author initial */}
                <div
                  className="text-[8px] font-medium opacity-60 text-center"
                  style={{ color: book.textColor }}
                >
                  {book.author.split(' ').pop()?.[0]}
                </div>
              </div>

              {/* Tooltip */}
              {hoveredBook === book.title && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1f1a17] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10 animate-fadeIn">
                  <p className="font-medium">{book.title}</p>
                  <p className="text-white/60 text-[10px]">{book.author}</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#1f1a17] rotate-45" />
                </div>
              )}
            </button>
          ))}

          {/* "Add more" placeholder */}
          <div className="w-12 h-40 rounded-sm border-2 border-dashed border-neutral-200 flex items-center justify-center text-neutral-300 hover:border-neutral-300 hover:text-neutral-400 transition-colors cursor-pointer">
            <span className="text-xl">+</span>
          </div>
        </div>

        {/* Shelf surface */}
        <div className="h-2.5 bg-gradient-to-b from-[#e8dcc8] to-[#d4c4a8] rounded-b-sm shadow-sm" />
      </div>
    </div>
  );
}
