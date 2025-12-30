import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCanonReadyBooks, getAllFiveStarBooks } from '@/lib/canon';

/**
 * GET /api/my-books
 *
 * Get all the user's five-star books, split into:
 * 1. Canon-ready: Books with reflections, scored and sorted
 * 2. All five-star: Every 5-star book (for reference)
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [canonReady, allFiveStar] = await Promise.all([
      getCanonReadyBooks(session.user.id),
      getAllFiveStarBooks(session.user.id),
    ]);

    // Separate into sections
    const inCanon = allFiveStar.filter((b) => b.isInCanon);
    const notInCanon = allFiveStar.filter((b) => !b.isInCanon);

    return NextResponse.json({
      canonReady, // Books with reflections, sorted by score
      allFiveStar: notInCanon, // All 5-star books not in canon
      inCanon, // Books already in canon
      stats: {
        totalFiveStar: allFiveStar.length,
        canonReadyCount: canonReady.length,
        inCanonCount: inCanon.length,
      },
    });
  } catch (error) {
    console.error('[My Books API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
