/**
 * Enrich covers for Mark's Top 10 books
 *
 * Run with: npx tsx scripts/enrich-top10-covers.ts
 */

import { PrismaClient } from '@prisma/client';
import { lookupCover } from '../src/lib/covers/lookup';

const prisma = new PrismaClient();

const DELAY_BETWEEN_LOOKUPS_MS = 500;

async function main() {
  console.log('='.repeat(60));
  console.log('Enriching covers for Top 10 books');
  console.log('='.repeat(60));
  console.log('');

  // Find Mark (the gift user)
  const mark = await prisma.user.findFirst({
    where: { isGiftUser: true },
  });

  if (!mark) {
    console.error('ERROR: No gift user found.');
    process.exit(1);
  }

  // Get Mark's Top 10 with books
  const topTen = await prisma.topTen.findFirst({
    where: { userId: mark.id },
    include: {
      items: {
        include: { book: true },
        orderBy: { rank: 'asc' },
      },
    },
  });

  if (!topTen || topTen.items.length === 0) {
    console.error("ERROR: Mark's Top 10 is empty.");
    process.exit(1);
  }

  console.log(`Found ${topTen.items.length} books to enrich\n`);

  let enriched = 0;
  let failed = 0;

  for (const item of topTen.items) {
    const book = item.book;

    // Skip if already has a cover
    if (book.coverUrl) {
      console.log(`  ${item.rank}. ${book.title} — already has cover`);
      continue;
    }

    console.log(`  ${item.rank}. Looking up: ${book.title} by ${book.author}...`);

    try {
      const cover = await lookupCover(
        book.title,
        book.author,
        book.isbn,
        book.isbn13
      );

      if (cover) {
        await prisma.book.update({
          where: { id: book.id },
          data: {
            coverUrl: cover.url,
            coverSource: cover.source,
            coverConfidence: cover.confidence,
            coverUpdatedAt: new Date(),
          },
        });
        console.log(`     ✓ Found (${cover.source}, ${cover.confidence})`);
        enriched++;
      } else {
        await prisma.book.update({
          where: { id: book.id },
          data: { coverUpdatedAt: new Date() },
        });
        console.log('     ✗ No cover found');
        failed++;
      }
    } catch (error) {
      console.error(`     ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      failed++;
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_LOOKUPS_MS));
  }

  console.log('');
  console.log('-'.repeat(60));
  console.log(`Enriched: ${enriched}, Failed: ${failed}`);
  console.log('-'.repeat(60));
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
