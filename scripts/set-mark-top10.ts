/**
 * Migration Script: Set Mark's Top 10 to the exact canonical list
 *
 * This script:
 * 1. Finds Mark (the gift user with isGiftUser: true)
 * 2. Resolves all 10 books (creates them if they don't exist)
 * 3. Clears any existing Top 10 entries
 * 4. Inserts the exact 1-10 list
 *
 * Run with: npx tsx scripts/set-mark-top10.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mark's canonical Top 10 - this is the source of truth
const MARKS_TOP_10 = [
  { rank: 1, title: 'The Art of Happiness', author: 'Dalai Lama' },
  { rank: 2, title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
  { rank: 3, title: 'Guns, Germs, and Steel', author: 'Jared Diamond' },
  { rank: 4, title: 'Sapiens', author: 'Yuval Noah Harari' },
  { rank: 5, title: 'White Fragility', author: 'Robin DiAngelo' },
  { rank: 6, title: 'Principles', author: 'Ray Dalio' },
  { rank: 7, title: 'The Changing World Order', author: 'Ray Dalio' },
  { rank: 8, title: 'Awareness', author: 'Anthony de Mello' },
  { rank: 9, title: 'The Psychology of Money', author: 'Morgan Housel' },
  { rank: 10, title: 'Interior Chinatown', author: 'Charles Yu' },
];

// Normalize title for matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize author for matching
function normalizeAuthor(author: string): string {
  return author
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function findOrCreateBook(title: string, author: string): Promise<string> {
  const normalizedTitle = normalizeTitle(title);
  const normalizedAuthor = normalizeAuthor(author);

  // Try to find by exact title match first
  let book = await prisma.book.findFirst({
    where: {
      title: {
        equals: title,
        mode: 'insensitive',
      },
    },
  });

  // If not found, try normalized title contains
  if (!book) {
    const books = await prisma.book.findMany({
      where: {
        title: {
          contains: normalizedTitle.substring(0, 15),
          mode: 'insensitive',
        },
      },
    });

    // Find best match
    book = books.find((b) => {
      const bookNormalizedTitle = normalizeTitle(b.title);
      const bookNormalizedAuthor = b.author ? normalizeAuthor(b.author) : '';
      return (
        bookNormalizedTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(bookNormalizedTitle)
      ) && (
        !b.author ||
        bookNormalizedAuthor.includes(normalizedAuthor) ||
        normalizedAuthor.includes(bookNormalizedAuthor)
      );
    }) || null;
  }

  // If still not found, create the book
  if (!book) {
    console.log(`  Creating book: "${title}" by ${author}`);
    book = await prisma.book.create({
      data: {
        title,
        author,
      },
    });
  } else {
    console.log(`  Found book: "${book.title}" by ${book.author} (id: ${book.id})`);
  }

  return book.id;
}

async function main() {
  console.log('='.repeat(60));
  console.log("Setting Mark's Top 10 to canonical list");
  console.log('='.repeat(60));
  console.log('');

  // 1. Find Mark (the gift user)
  console.log('Step 1: Finding Mark (gift user)...');
  const mark = await prisma.user.findFirst({
    where: { isGiftUser: true },
  });

  if (!mark) {
    console.error('ERROR: No gift user found. Create Mark first.');
    process.exit(1);
  }

  console.log(`  Found Mark: ${mark.name || mark.email} (id: ${mark.id})`);
  console.log('');

  // 2. Resolve all 10 books
  console.log('Step 2: Resolving books...');
  const resolvedBooks: { rank: number; bookId: string }[] = [];

  for (const item of MARKS_TOP_10) {
    const bookId = await findOrCreateBook(item.title, item.author);
    resolvedBooks.push({ rank: item.rank, bookId });
  }

  // Validate: 10 distinct book IDs
  const uniqueBookIds = new Set(resolvedBooks.map((b) => b.bookId));
  if (uniqueBookIds.size !== 10) {
    console.error('ERROR: Did not resolve 10 unique books. Check for duplicates.');
    console.error('Resolved:', resolvedBooks);
    process.exit(1);
  }
  console.log('');

  // 3. Find or create Mark's TopTen list
  console.log("Step 3: Finding or creating Mark's TopTen list...");
  let topTen = await prisma.topTen.findFirst({
    where: { userId: mark.id },
  });

  if (!topTen) {
    topTen = await prisma.topTen.create({
      data: {
        userId: mark.id,
        name: 'Top 10',
        isPublic: true,
      },
    });
    console.log(`  Created new TopTen list (id: ${topTen.id})`);
  } else {
    console.log(`  Found existing TopTen list (id: ${topTen.id})`);
  }
  console.log('');

  // 4. Clear existing entries and insert new ones (transaction)
  console.log('Step 4: Setting Top 10 entries...');

  await prisma.$transaction(async (tx) => {
    // Delete existing entries
    const deleted = await tx.topTenItem.deleteMany({
      where: { topTenId: topTen!.id },
    });
    console.log(`  Deleted ${deleted.count} existing entries`);

    // Insert new entries
    for (const item of resolvedBooks) {
      await tx.topTenItem.create({
        data: {
          topTenId: topTen!.id,
          bookId: item.bookId,
          rank: item.rank,
        },
      });
    }
    console.log(`  Inserted ${resolvedBooks.length} new entries`);

    // Update the TopTen timestamp
    await tx.topTen.update({
      where: { id: topTen!.id },
      data: { updatedAt: new Date() },
    });
  });

  console.log('');

  // 5. Verify the result
  console.log('Step 5: Verifying result...');
  const finalList = await prisma.topTen.findUnique({
    where: { id: topTen.id },
    include: {
      items: {
        include: { book: true },
        orderBy: { rank: 'asc' },
      },
    },
  });

  console.log('');
  console.log("Mark's Top 10 (final):");
  console.log('-'.repeat(60));
  for (const item of finalList!.items) {
    console.log(`  ${item.rank}. ${item.book.title} — ${item.book.author || 'Unknown'}`);
  }
  console.log('-'.repeat(60));
  console.log('');
  console.log('SUCCESS: Migration complete!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
