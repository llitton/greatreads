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
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">📚</span>
        <h2 className="font-serif font-bold text-[#1f1a17] text-lg">
          Mark&apos;s Favorites
        </h2>
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
                className="w-14 h-44 rounded-sm shadow-md flex flex-col justify-between p-2 border-l-4 transition-shadow hover:shadow-lg"
                style={{
                  backgroundColor: book.color,
                  borderLeftColor: book.color === '#f5f5f5' ? '#e0e0e0' : 'rgba(0,0,0,0.2)',
                }}
              >
                {/* Title (vertical) */}
                <div
                  className="writing-mode-vertical text-[10px] font-medium leading-tight line-clamp-3 overflow-hidden"
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
                  className="text-[8px] font-medium opacity-70 text-center"
                  style={{ color: book.textColor }}
                >
                  {book.author.split(' ').pop()?.[0]}
                </div>
              </div>

              {/* Tooltip */}
              {hoveredBook === book.title && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1f1a17] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10 animate-fadeIn">
                  <p className="font-medium">{book.title}</p>
                  <p className="text-white/70 text-[10px]">{book.author}</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#1f1a17] rotate-45" />
                </div>
              )}
            </button>
          ))}

          {/* "Add more" placeholder */}
          <div className="w-14 h-44 rounded-sm border-2 border-dashed border-[#e8e0d4] flex items-center justify-center text-[#8b7355] hover:border-[#c4b8a8] hover:text-[#5b4a3f] transition-colors cursor-pointer">
            <span className="text-2xl">+</span>
          </div>
        </div>

        {/* Shelf surface */}
        <div className="h-3 bg-gradient-to-b from-[#d4c4a8] to-[#c4b498] rounded-b-sm shadow-md" />
      </div>

      {/* Subtitle */}
      <p className="text-xs text-[#8b7355] mt-3">
        Books that shaped how Mark thinks
      </p>
    </div>
  );
}
