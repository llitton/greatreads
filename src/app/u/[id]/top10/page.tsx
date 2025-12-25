import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicTop10Page({ params }: PageProps) {
  const { id } = await params;

  const topTen = await prisma.topTen.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true },
      },
      items: {
        include: {
          book: true,
        },
        orderBy: { rank: 'asc' },
      },
    },
  });

  if (!topTen || !topTen.isPublic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🏆</div>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-brown-dark)]">
            {topTen.user.name || 'Someone'}&apos;s Top 10 Books
          </h1>
          <p className="mt-2 text-[var(--color-brown)]">
            Their favorite books of all time
          </p>
        </div>

        {/* List */}
        {topTen.items.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-[var(--color-brown)]">
              This Top 10 list is empty.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topTen.items.map((item) => (
              <div key={item.id} className="card p-4 flex items-center gap-4">
                {/* Rank */}
                <span className="w-8 h-8 flex items-center justify-center bg-[var(--color-gold)] text-white text-lg font-bold rounded-full flex-shrink-0">
                  {item.rank}
                </span>

                {/* Cover */}
                {item.book.coverUrl ? (
                  <img
                    src={item.book.coverUrl}
                    alt=""
                    className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 bg-[var(--color-parchment)] rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📕</span>
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif font-bold text-[var(--color-brown-dark)]">
                    {item.book.title}
                  </h3>
                  {item.book.author && (
                    <p className="text-sm text-[var(--color-brown)]">{item.book.author}</p>
                  )}
                </div>

                {/* Goodreads link */}
                {item.book.goodreadsBookUrl && (
                  <a
                    href={item.book.goodreadsBookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-brown)] hover:underline"
                  >
                    Goodreads →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--color-brown-light)]">
            Made with{' '}
            <a href="/" className="underline">
              GreatReads
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
