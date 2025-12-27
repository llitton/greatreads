import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * One-time cleanup and reframing API
 *
 * This endpoint:
 * 1. Deletes all non-5-star books that aren't favorites or in Top 10
 * 2. Tags remaining books with the source person name
 *
 * Run once to align the app with its soul:
 * - GreatReads is not a reading tracker
 * - It's a signal library of books that mattered
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sourcePersonName = 'Laura', dryRun = true } = body;

    // Get count of books that will be deleted
    const toDelete = await prisma.userBookStatus.findMany({
      where: {
        OR: [
          { userRating: { lt: 5 } },
          { userRating: null }
        ],
        isFavorite: false,
        // Not in any Top 10 list
        book: {
          topTenItems: {
            none: {}
          }
        }
      },
      include: {
        book: { select: { title: true, author: true } }
      }
    });

    // Get count of books that will be kept
    const toKeep = await prisma.userBookStatus.findMany({
      where: {
        OR: [
          { userRating: 5 },
          { isFavorite: true },
          {
            book: {
              topTenItems: {
                some: {}
              }
            }
          }
        ]
      },
      include: {
        book: { select: { title: true, author: true } }
      }
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        message: 'This is a preview. Set dryRun: false to execute.',
        toDelete: {
          count: toDelete.length,
          books: toDelete.slice(0, 20).map(s => ({
            title: s.book.title,
            author: s.book.author,
            rating: s.userRating,
            isFavorite: s.isFavorite
          }))
        },
        toKeep: {
          count: toKeep.length,
          books: toKeep.map(s => ({
            title: s.book.title,
            author: s.book.author,
            rating: s.userRating,
            isFavorite: s.isFavorite
          }))
        },
        sourcePersonName
      });
    }

    // Step 1: Delete non-signal books
    const deleteResult = await prisma.userBookStatus.deleteMany({
      where: {
        OR: [
          { userRating: { lt: 5 } },
          { userRating: null }
        ],
        isFavorite: false,
        book: {
          topTenItems: {
            none: {}
          }
        }
      }
    });

    // Step 2: Tag remaining books with source person name
    const updateResult = await prisma.userBookStatus.updateMany({
      where: {
        sourcePersonName: null
      },
      data: {
        sourcePersonName
      }
    });

    // Step 3: Clean up orphaned books (books with no statuses or events)
    const orphanedBooks = await prisma.book.deleteMany({
      where: {
        userBookStatuses: { none: {} },
        events: { none: {} },
        topTenItems: { none: {} }
      }
    });

    return NextResponse.json({
      success: true,
      deleted: deleteResult.count,
      tagged: updateResult.count,
      orphanedBooksRemoved: orphanedBooks.count,
      remaining: toKeep.length,
      sourcePersonName
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
