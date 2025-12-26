'use client';

interface DemoBook {
  title: string;
  author: string;
  coverUrl: string;
  friendName: string;
  snippet?: string;
}

const demoBooks: DemoBook[] = [
  {
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author: 'Gabrielle Zevin',
    coverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1636978687i/58784475.jpg',
    friendName: 'Sarah',
    snippet: 'A beautiful story about friendship, creativity, and the games we play.',
  },
  {
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    coverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1597695864i/54493401.jpg',
    friendName: 'Mike',
    snippet: 'Couldn\'t put it down. Best sci-fi I\'ve read in years.',
  },
  {
    title: 'The House in the Cerulean Sea',
    author: 'TJ Klune',
    coverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1569514209i/45047384.jpg',
    friendName: 'Emma',
    snippet: 'Heartwarming and hopeful. Made me cry happy tears.',
  },
];

interface DemoFeedCardProps {
  book: DemoBook;
  index: number;
}

function DemoFeedCard({ book, index }: DemoFeedCardProps) {
  return (
    <article
      className="relative bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Demo overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 pointer-events-none z-10" />
      <div className="absolute bottom-4 left-0 right-0 text-center z-20">
        <span className="inline-block px-3 py-1 bg-neutral-50 text-neutral-400 text-xs font-medium rounded-full">
          Example
        </span>
      </div>

      {/* Book spine accent */}
      <div className="flex">
        <div className="w-1.5 bg-gradient-to-b from-[#d4a855] to-[#c49845] flex-shrink-0 opacity-50" />

        <div className="flex-1 p-6">
          <div className="flex gap-5">
            {/* Cover */}
            <div className="flex-shrink-0">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-16 h-24 object-cover rounded-lg shadow-sm opacity-80"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-serif font-bold text-[#1f1a17] leading-tight line-clamp-2">
                  {book.title}
                </h3>
              </div>
              <p className="text-sm text-[#5b4a3f] mb-3">by {book.author}</p>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-[#d4a855] text-sm">★</span>
                ))}
              </div>

              {/* Friend */}
              <p className="text-sm text-[#8b7355]">
                <span className="font-medium text-[#5b4a3f]">{book.friendName}</span> loved this
              </p>

              {book.snippet && (
                <p className="mt-3 text-sm text-[#5b4a3f] italic line-clamp-2">
                  &ldquo;{book.snippet}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function DemoFeed() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-neutral-400">
          Here&apos;s what your feed will look like
        </p>
      </div>
      {demoBooks.map((book, index) => (
        <DemoFeedCard key={book.title} book={book} index={index} />
      ))}
    </div>
  );
}
