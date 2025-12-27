import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RssActionStatus, BookStatus } from '@prisma/client';
import { z } from 'zod';

const saveSchema = z.object({
  sourcePersonName: z.string().max(100).optional(),
});

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

/**
 * POST /api/rss/items/:itemId/save
 * Save an item to signals (creates Book + UserBookStatus)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { itemId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { sourcePersonName } = saveSchema.parse(body);

    // Get the RSS item with source info
    const item = await prisma.rssItem.findUnique({
      where: { id: itemId },
      include: {
        source: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const bookTitle = item.bookTitle || item.title;
    const bookAuthor = item.bookAuthor || item.author;

    if (!bookTitle) {
      return NextResponse.json(
        { error: 'Cannot save item without a title' },
        { status: 400 }
      );
    }

    // Find or create book
    let book = await findExistingBook(item.isbn, bookTitle, bookAuthor);

    if (!book) {
      book = await prisma.book.create({
        data: {
          title: bookTitle,
          author: bookAuthor,
          isbn: item.isbn,
          coverUrl: item.coverImageUrl,
        },
      });
    }

    // Determine source person name
    const personName = sourcePersonName || item.source.title || 'Unknown';

    // Create or update user book status
    const status = await prisma.userBookStatus.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: book.id,
        },
      },
      update: {
        // Don't overwrite existing status, just ensure it exists
        sourcePersonName: personName,
      },
      create: {
        userId: session.user.id,
        bookId: book.id,
        status: BookStatus.WANT_TO_READ,
        sourcePersonName: personName,
        isPublic: false, // Saved from feed, not imported
      },
    });

    // Update RSS item action
    await prisma.rssItemAction.upsert({
      where: {
        userId_itemId: {
          userId: session.user.id,
          itemId,
        },
      },
      update: {
        status: RssActionStatus.SAVED,
        savedAt: new Date(),
        bookId: book.id,
      },
      create: {
        userId: session.user.id,
        itemId,
        status: RssActionStatus.SAVED,
        savedAt: new Date(),
        bookId: book.id,
      },
    });

    return NextResponse.json({
      ok: true,
      bookId: book.id,
      statusId: status.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to save item:', error);
    return NextResponse.json(
      { error: 'Failed to save item' },
      { status: 500 }
    );
  }
}

/**
 * Find existing book by ISBN or normalized title+author
 */
async function findExistingBook(
  isbn: string | null | undefined,
  title: string,
  author: string | null | undefined
) {
  // Try ISBN first
  if (isbn) {
    const byIsbn = await prisma.book.findFirst({
      where: {
        OR: [{ isbn }, { isbn13: isbn }],
      },
    });
    if (byIsbn) return byIsbn;
  }

  // Try normalized title + author
  const normalizedTitle = title.toLowerCase().trim();
  const normalizedAuthor = author?.toLowerCase().trim();

  const byTitleAuthor = await prisma.book.findFirst({
    where: {
      title: { equals: normalizedTitle, mode: 'insensitive' },
      ...(normalizedAuthor && {
        author: { equals: normalizedAuthor, mode: 'insensitive' },
      }),
    },
  });

  return byTitleAuthor;
}
