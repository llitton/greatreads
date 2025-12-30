#!/usr/bin/env npx tsx
/**
 * Cover Backfill Script
 *
 * Resolves covers for all books that don't have them yet.
 * Run with: npx tsx scripts/backfill-covers.ts
 *
 * Options:
 *   --limit N     Process at most N books (default: all)
 *   --delay N     Delay between books in ms (default: 500)
 *   --priority    Process Canon and Top 10 books first
 *   --dry-run     Show what would be processed without doing it
 */

import { PrismaClient } from '@prisma/client';
import { resolveCover } from '../src/lib/covers/resolver';

const prisma = new PrismaClient();

interface BackfillOptions {
  limit?: number;
  delayMs: number;
  priorityFirst: boolean;
  dryRun: boolean;
}

async function getBooksPrioritized(limit?: number): Promise<string[]> {
  // Priority 1: Canon entries (most visible)
  // Canon is linked through UserBookStatus -> CanonEntry
  const canonUserBooks = await prisma.userBookStatus.findMany({
    where: {
      canonEntry: { isNot: null },
      book: {
        OR: [
          { resolvedCover: null },
          { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
        ],
      },
    },
    select: { bookId: true },
    take: limit,
  });

  const canonIds = new Set(canonUserBooks.map((ub) => ub.bookId));

  // Priority 2: Top 10 books (TopTenItem links directly to Book)
  const top10Books = await prisma.book.findMany({
    where: {
      id: { notIn: Array.from(canonIds) },
      topTenItems: { some: {} },
      OR: [
        { resolvedCover: null },
        { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
      ],
    },
    select: { id: true },
    take: limit ? limit - canonIds.size : undefined,
  });

  const top10Ids = new Set(top10Books.map((b) => b.id));
  const priorityIds = new Set([...canonIds, ...top10Ids]);

  // Priority 3: Books with high ratings (5 stars via UserBookStatus)
  const highRatedUserBooks = await prisma.userBookStatus.findMany({
    where: {
      bookId: { notIn: Array.from(priorityIds) },
      userRating: 5,
      book: {
        OR: [
          { resolvedCover: null },
          { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
        ],
      },
    },
    select: { bookId: true },
    take: limit ? limit - priorityIds.size : undefined,
  });

  const highRatedIds = new Set(highRatedUserBooks.map((ub) => ub.bookId));
  const processedIds = new Set([...priorityIds, ...highRatedIds]);

  // Priority 4: All other books
  const remainingLimit = limit ? limit - processedIds.size : undefined;
  const otherBooks =
    remainingLimit === undefined || remainingLimit > 0
      ? await prisma.book.findMany({
          where: {
            id: { notIn: Array.from(processedIds) },
            OR: [
              { resolvedCover: null },
              { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
            ],
          },
          select: { id: true },
          take: remainingLimit,
        })
      : [];

  return [
    ...Array.from(canonIds),
    ...Array.from(top10Ids),
    ...Array.from(highRatedIds),
    ...otherBooks.map((b) => b.id),
  ];
}

async function getBooksSimple(limit?: number): Promise<string[]> {
  const books = await prisma.book.findMany({
    where: {
      OR: [
        { resolvedCover: null },
        { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
      ],
    },
    select: { id: true, title: true },
    take: limit,
  });

  return books.map((b) => b.id);
}

async function backfillCovers(options: BackfillOptions): Promise<void> {
  console.log('\n📚 Cover Backfill Job Starting...\n');
  console.log(`Options: ${JSON.stringify(options, null, 2)}\n`);

  // Get books to process
  const bookIds = options.priorityFirst
    ? await getBooksPrioritized(options.limit)
    : await getBooksSimple(options.limit);

  console.log(`Found ${bookIds.length} books needing covers\n`);

  if (bookIds.length === 0) {
    console.log('✅ All books already have covers!');
    return;
  }

  if (options.dryRun) {
    console.log('DRY RUN - Would process these books:');
    const books = await prisma.book.findMany({
      where: { id: { in: bookIds.slice(0, 20) } },
      select: { id: true, title: true, author: true },
    });
    books.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.title} by ${b.author || 'Unknown'}`);
    });
    if (bookIds.length > 20) {
      console.log(`  ... and ${bookIds.length - 20} more`);
    }
    return;
  }

  // Process books
  let resolved = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < bookIds.length; i++) {
    const bookId = bookIds[i];

    // Get book details for logging
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { title: true, author: true },
    });

    process.stdout.write(
      `[${i + 1}/${bookIds.length}] ${book?.title?.slice(0, 40)}... `
    );

    try {
      const result = await resolveCover(bookId);

      if (result.success) {
        resolved++;
        console.log(`✅ ${result.source} (${result.confidence})`);
      } else {
        failed++;
        console.log(`❌ ${result.error}`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ Error: ${error}`);
    }

    // Delay between requests
    if (i < bookIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }

    // Progress update every 50 books
    if ((i + 1) % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = ((i + 1) / parseFloat(elapsed)).toFixed(1);
      console.log(`\n📊 Progress: ${i + 1}/${bookIds.length} (${rate}/sec)\n`);
    }
  }

  // Final summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(50));
  console.log('📊 Backfill Complete!');
  console.log('='.repeat(50));
  console.log(`Total processed: ${bookIds.length}`);
  console.log(`Resolved:        ${resolved} (${((resolved / bookIds.length) * 100).toFixed(1)}%)`);
  console.log(`Failed:          ${failed}`);
  console.log(`Time:            ${elapsed}s`);
  console.log('='.repeat(50) + '\n');
}

// Parse command line arguments
function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2);
  const options: BackfillOptions = {
    delayMs: 500,
    priorityFirst: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--limit':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--delay':
        options.delayMs = parseInt(args[++i], 10);
        break;
      case '--priority':
        options.priorityFirst = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
        console.log(`
Cover Backfill Script

Usage: npx tsx scripts/backfill-covers.ts [options]

Options:
  --limit N     Process at most N books (default: all)
  --delay N     Delay between books in ms (default: 500)
  --priority    Process Canon and Top 10 books first
  --dry-run     Show what would be processed without doing it
  --help        Show this help message
`);
        process.exit(0);
    }
  }

  return options;
}

// Main
async function main() {
  try {
    const options = parseArgs();
    await backfillCovers(options);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
