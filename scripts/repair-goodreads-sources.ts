/**
 * Auto-repair Goodreads RSS Sources
 *
 * Finds sources that failed with "This doesn't look like an RSS feed"
 * and converts their URLs from page format to RSS format.
 *
 * Run with: npx tsx scripts/repair-goodreads-sources.ts
 */

import { PrismaClient } from '@prisma/client';
import { normalizeGoodreadsUrl, isGoodreadsPageUrl } from '../src/lib/goodreads/url';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('Repairing Goodreads RSS Sources');
  console.log('='.repeat(60));
  console.log('');

  // Find all failed or backoff sources
  const brokenSources = await prisma.rssSource.findMany({
    where: {
      OR: [
        { status: 'FAILED' },
        { status: 'BACKOFF' },
        { failureReasonCode: 'NOT_FEED' },
      ],
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  console.log(`Found ${brokenSources.length} broken source(s)\n`);

  if (brokenSources.length === 0) {
    console.log('No broken sources to repair.');
    return;
  }

  let repaired = 0;
  let skipped = 0;

  for (const source of brokenSources) {
    console.log(`\n${'-'.repeat(50)}`);
    console.log(`Source: ${source.title || 'Untitled'}`);
    console.log(`User: ${source.user.name || source.user.email}`);
    console.log(`URL: ${source.url}`);
    console.log(`Status: ${source.status} (${source.failureReasonCode || 'no code'})`);
    console.log(`Error: ${source.lastError || 'none'}`);

    // Check if this is a Goodreads page URL (not RSS)
    if (!source.url.includes('goodreads.com')) {
      console.log('  → Not a Goodreads URL, skipping');
      skipped++;
      continue;
    }

    // Try to normalize the URL
    const result = normalizeGoodreadsUrl(source.url);

    if (result.error) {
      console.log(`  → Error: ${result.error}`);
      skipped++;
      continue;
    }

    if (!result.converted) {
      console.log('  → Already in correct format, skipping');
      skipped++;
      continue;
    }

    console.log(`  → Converting to: ${result.url}`);

    // Update the source
    await prisma.rssSource.update({
      where: { id: source.id },
      data: {
        url: result.url,
        status: 'VALIDATING', // Will be re-validated on next cron run
        failureReasonCode: 'NONE',
        consecutiveFailures: 0,
        lastError: null,
        lastAttemptAt: null,
        nextAttemptAt: null,
      },
    });

    console.log('  ✓ Repaired! Status set to VALIDATING.');
    repaired++;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Repaired: ${repaired}, Skipped: ${skipped}`);
  console.log('='.repeat(60));

  if (repaired > 0) {
    console.log('\nRepaired sources will be re-validated on the next cron run.');
    console.log('You can trigger this manually by calling GET /api/rss/cron/fetch');
  }
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
