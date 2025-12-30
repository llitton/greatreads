/**
 * Canon Service
 *
 * Handles canon-ready scoring and canon management.
 * Canon = the books that define you. Promotion to canon requires reflection.
 */

import { prisma } from '@/lib/prisma';
import { ReflectionKind } from '@prisma/client';

// Scoring weights for canon-readiness
const SCORE_WEIGHTS = {
  PROMPT_OR_REVISIT_KIND: 6, // Reflection is PROMPT or REVISIT
  MULTIPLE_REFLECTIONS: 4, // Has been revised/edited
  FROM_TRUSTED_SOURCE: 3, // From circle, not self-import
  RECENT_REFLECTION: 2, // Updated in last 30 days
  FIVE_STAR: 1, // Has 5-star rating
} as const;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface CanonReadyBook {
  userBookId: string;
  bookId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  userRating: number | null;
  sourcePersonName: string | null;
  reflection: {
    id: string;
    content: string;
    kind: ReflectionKind;
    updatedAt: Date;
  } | null;
  score: number;
  scoreBreakdown: {
    promptOrRevisitKind: boolean;
    multipleReflections: boolean;
    fromTrustedSource: boolean;
    recentReflection: boolean;
    fiveStar: boolean;
  };
}

/**
 * Get books that are "canon-ready" - have reflections and score high enough
 * to be candidates for canon promotion.
 */
export async function getCanonReadyBooks(
  userId: string
): Promise<CanonReadyBook[]> {
  // Get all 5-star books with reflections that are NOT already in canon
  const userBooks = await prisma.userBookStatus.findMany({
    where: {
      userId,
      userRating: 5,
      reflection: { isNot: null }, // Has a reflection
      canonEntry: null, // Not already in canon
    },
    include: {
      book: {
        include: {
          resolvedCover: { select: { imageUrl: true } },
        },
      },
      reflection: true,
    },
    orderBy: {
      reflection: { updatedAt: 'desc' },
    },
  });

  // Score each book
  const scoredBooks: CanonReadyBook[] = userBooks.map((ub) => {
    const reflection = ub.reflection!;
    const now = Date.now();
    const reflectionAge = now - reflection.updatedAt.getTime();

    // Score breakdown
    const promptOrRevisitKind =
      reflection.kind === ReflectionKind.PROMPT ||
      reflection.kind === ReflectionKind.REVISIT;
    const multipleReflections =
      reflection.updatedAt.getTime() !== reflection.createdAt.getTime();
    const fromTrustedSource =
      ub.sourcePersonName !== null && ub.sourcePersonName.length > 0;
    const recentReflection = reflectionAge < THIRTY_DAYS_MS;
    const fiveStar = ub.userRating === 5;

    // Calculate score
    let score = 0;
    if (promptOrRevisitKind) score += SCORE_WEIGHTS.PROMPT_OR_REVISIT_KIND;
    if (multipleReflections) score += SCORE_WEIGHTS.MULTIPLE_REFLECTIONS;
    if (fromTrustedSource) score += SCORE_WEIGHTS.FROM_TRUSTED_SOURCE;
    if (recentReflection) score += SCORE_WEIGHTS.RECENT_REFLECTION;
    if (fiveStar) score += SCORE_WEIGHTS.FIVE_STAR;

    return {
      userBookId: ub.id,
      bookId: ub.bookId,
      title: ub.book.title,
      author: ub.book.author,
      coverUrl: ub.book.resolvedCover?.imageUrl ?? ub.book.coverUrl,
      userRating: ub.userRating,
      sourcePersonName: ub.sourcePersonName,
      reflection: {
        id: reflection.id,
        content: reflection.content,
        kind: reflection.kind,
        updatedAt: reflection.updatedAt,
      },
      score,
      scoreBreakdown: {
        promptOrRevisitKind,
        multipleReflections,
        fromTrustedSource,
        recentReflection,
        fiveStar,
      },
    };
  });

  // Sort by score descending, then by reflection updated date
  scoredBooks.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (
      (b.reflection?.updatedAt.getTime() ?? 0) -
      (a.reflection?.updatedAt.getTime() ?? 0)
    );
  });

  return scoredBooks;
}

/**
 * Get all 5-star books (without filtering by reflection)
 */
export async function getAllFiveStarBooks(userId: string) {
  const userBooks = await prisma.userBookStatus.findMany({
    where: {
      userId,
      userRating: 5,
    },
    include: {
      book: {
        include: {
          resolvedCover: { select: { imageUrl: true } },
        },
      },
      reflection: true,
      canonEntry: { select: { id: true, addedAt: true, position: true } },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return userBooks.map((ub) => ({
    userBookId: ub.id,
    bookId: ub.bookId,
    title: ub.book.title,
    author: ub.book.author,
    coverUrl: ub.book.resolvedCover?.imageUrl ?? ub.book.coverUrl,
    userRating: ub.userRating,
    sourcePersonName: ub.sourcePersonName,
    hasReflection: ub.reflection !== null,
    isInCanon: ub.canonEntry !== null,
    canonPosition: ub.canonEntry?.position ?? null,
  }));
}

/**
 * Get the user's current canon (active entries only)
 */
export async function getCanon(userId: string) {
  const entries = await prisma.canonEntry.findMany({
    where: {
      userBook: { userId },
      removedAt: null,
    },
    include: {
      userBook: {
        include: {
          book: {
            include: {
              resolvedCover: { select: { imageUrl: true } },
            },
          },
        },
      },
      reflection: true,
    },
    orderBy: { position: 'asc' },
  });

  return entries.map((entry) => ({
    id: entry.id,
    position: entry.position,
    addedAt: entry.addedAt,
    userBookId: entry.userBookId,
    bookId: entry.userBook.bookId,
    title: entry.userBook.book.title,
    author: entry.userBook.book.author,
    coverUrl:
      entry.userBook.book.resolvedCover?.imageUrl ??
      entry.userBook.book.coverUrl,
    reflection: {
      id: entry.reflection.id,
      content: entry.reflection.content,
      kind: entry.reflection.kind,
    },
  }));
}

/**
 * Add a book to the user's canon.
 * Requires a reflection - creates one if content is provided.
 */
export async function addToCanon(
  userId: string,
  userBookId: string,
  reflectionContent: string,
  reflectionKind: ReflectionKind = ReflectionKind.PROMPT
): Promise<{ success: boolean; canonEntryId?: string; error?: string }> {
  // Verify the userBook belongs to this user
  const userBook = await prisma.userBookStatus.findUnique({
    where: { id: userBookId },
    include: { reflection: true, canonEntry: true },
  });

  if (!userBook || userBook.userId !== userId) {
    return { success: false, error: 'Book not found' };
  }

  if (userBook.canonEntry) {
    return { success: false, error: 'Book is already in your canon' };
  }

  // Check canon limit (10 books)
  const currentCanonCount = await prisma.canonEntry.count({
    where: {
      userBook: { userId },
      removedAt: null,
    },
  });

  if (currentCanonCount >= 10) {
    return {
      success: false,
      error: 'Your canon is full. Remove a book first.',
    };
  }

  // Create or update reflection
  let reflectionId: string;
  if (userBook.reflection) {
    // Update existing reflection
    const updated = await prisma.reflection.update({
      where: { id: userBook.reflection.id },
      data: {
        content: reflectionContent,
        kind: reflectionKind,
      },
    });
    reflectionId = updated.id;
  } else {
    // Create new reflection
    const created = await prisma.reflection.create({
      data: {
        userBookId,
        content: reflectionContent,
        kind: reflectionKind,
      },
    });
    reflectionId = created.id;
  }

  // Get next position
  const maxPosition = await prisma.canonEntry.aggregate({
    where: {
      userBook: { userId },
      removedAt: null,
    },
    _max: { position: true },
  });

  const nextPosition = (maxPosition._max.position ?? 0) + 1;

  // Create canon entry
  const canonEntry = await prisma.canonEntry.create({
    data: {
      userBookId,
      reflectionId,
      position: nextPosition,
    },
  });

  return { success: true, canonEntryId: canonEntry.id };
}

/**
 * Remove a book from the user's canon.
 * Soft delete - sets removedAt timestamp.
 */
export async function removeFromCanon(
  userId: string,
  canonEntryId: string
): Promise<{ success: boolean; error?: string }> {
  const entry = await prisma.canonEntry.findUnique({
    where: { id: canonEntryId },
    include: { userBook: true },
  });

  if (!entry || entry.userBook.userId !== userId) {
    return { success: false, error: 'Canon entry not found' };
  }

  if (entry.removedAt) {
    return { success: false, error: 'Already removed from canon' };
  }

  await prisma.canonEntry.update({
    where: { id: canonEntryId },
    data: { removedAt: new Date() },
  });

  // Reorder remaining entries to close the gap
  const remainingEntries = await prisma.canonEntry.findMany({
    where: {
      userBook: { userId },
      removedAt: null,
    },
    orderBy: { position: 'asc' },
  });

  for (let i = 0; i < remainingEntries.length; i++) {
    if (remainingEntries[i].position !== i + 1) {
      await prisma.canonEntry.update({
        where: { id: remainingEntries[i].id },
        data: { position: i + 1 },
      });
    }
  }

  return { success: true };
}

/**
 * Reorder canon entries
 */
export async function reorderCanon(
  userId: string,
  orderedEntryIds: string[]
): Promise<{ success: boolean; error?: string }> {
  // Verify all entries belong to this user and are active
  const entries = await prisma.canonEntry.findMany({
    where: {
      id: { in: orderedEntryIds },
      userBook: { userId },
      removedAt: null,
    },
  });

  if (entries.length !== orderedEntryIds.length) {
    return { success: false, error: 'Invalid entry IDs' };
  }

  // Update positions
  for (let i = 0; i < orderedEntryIds.length; i++) {
    await prisma.canonEntry.update({
      where: { id: orderedEntryIds[i] },
      data: { position: i + 1 },
    });
  }

  return { success: true };
}
