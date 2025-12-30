#!/usr/bin/env npx tsx
/**
 * Circle Migration Script
 *
 * Migrates from source-based circle to person-based circle:
 * 1. Creates Person records from existing source names
 * 2. Links sources to their Person
 * 3. Creates CircleMembership for each (user, person) pair
 *
 * Run with: npx tsx scripts/migrate-circle.ts
 * Options:
 *   --dry-run    Show what would be migrated without making changes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

interface MigrationStats {
  personsCreated: number;
  rssSourcesLinked: number;
  friendSourcesLinked: number;
  membershipsCreated: number;
  duplicatesFound: number;
}

async function migrateCircle(dryRun: boolean): Promise<MigrationStats> {
  const stats: MigrationStats = {
    personsCreated: 0,
    rssSourcesLinked: 0,
    friendSourcesLinked: 0,
    membershipsCreated: 0,
    duplicatesFound: 0,
  };

  console.log('\n📚 Circle Migration Starting...\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Step 1: Get all RSS sources with names (from title field)
  const rssSources = await prisma.rssSource.findMany({
    where: {
      title: { not: null },
      personId: null, // Not yet linked
    },
    select: {
      id: true,
      userId: true,
      title: true,
      url: true,
    },
  });

  console.log(`Found ${rssSources.length} RSS sources to migrate`);

  // Step 2: Get all FriendSources with names (from label field)
  const friendSources = await prisma.friendSource.findMany({
    where: {
      personId: null, // Not yet linked
    },
    select: {
      id: true,
      userId: true,
      label: true,
      rssUrl: true,
    },
  });

  console.log(`Found ${friendSources.length} FriendSources to migrate`);

  // Step 3: Build a map of (userId, normalizedName) -> sources
  const sourcesByUserAndName = new Map<
    string,
    {
      userId: string;
      displayName: string;
      normalizedName: string;
      rssSources: typeof rssSources;
      friendSources: typeof friendSources;
    }
  >();

  for (const source of rssSources) {
    if (!source.title) continue;
    const normalized = normalizeName(source.title);
    const key = `${source.userId}:${normalized}`;

    if (!sourcesByUserAndName.has(key)) {
      sourcesByUserAndName.set(key, {
        userId: source.userId,
        displayName: source.title,
        normalizedName: normalized,
        rssSources: [],
        friendSources: [],
      });
    }
    sourcesByUserAndName.get(key)!.rssSources.push(source);
  }

  for (const source of friendSources) {
    const normalized = normalizeName(source.label);
    const key = `${source.userId}:${normalized}`;

    if (!sourcesByUserAndName.has(key)) {
      sourcesByUserAndName.set(key, {
        userId: source.userId,
        displayName: source.label,
        normalizedName: normalized,
        rssSources: [],
        friendSources: [],
      });
    }
    sourcesByUserAndName.get(key)!.friendSources.push(source);
  }

  console.log(`\nFound ${sourcesByUserAndName.size} unique (user, person) pairs`);

  // Track duplicates
  for (const [key, data] of sourcesByUserAndName.entries()) {
    const totalSources = data.rssSources.length + data.friendSources.length;
    if (totalSources > 1) {
      stats.duplicatesFound++;
      console.log(
        `  ⚠️  ${data.displayName}: ${totalSources} sources will be merged`
      );
    }
  }

  if (dryRun) {
    console.log('\n=== DRY RUN - No changes made ===\n');
    console.log('Would create:');
    console.log(`  - ${sourcesByUserAndName.size} Person records`);
    console.log(`  - ${rssSources.length} RssSource links`);
    console.log(`  - ${friendSources.length} FriendSource links`);
    console.log(`  - ${sourcesByUserAndName.size} CircleMembership records`);
    console.log(`\nDuplicates that would be merged: ${stats.duplicatesFound}`);
    return stats;
  }

  // Step 4: For each unique (user, name) pair, create/find Person and link
  console.log('\nMigrating...\n');

  for (const [key, data] of sourcesByUserAndName.entries()) {
    // Find or create Person (globally by normalizedName)
    let person = await prisma.person.findFirst({
      where: { normalizedName: data.normalizedName },
    });

    if (!person) {
      person = await prisma.person.create({
        data: {
          displayName: data.displayName,
          normalizedName: data.normalizedName,
        },
      });
      stats.personsCreated++;
      console.log(`  ✓ Created Person: ${data.displayName}`);
    }

    // Link RSS sources to this person
    for (const source of data.rssSources) {
      await prisma.rssSource.update({
        where: { id: source.id },
        data: { personId: person.id },
      });
      stats.rssSourcesLinked++;
    }

    // Link FriendSources to this person
    for (const source of data.friendSources) {
      await prisma.friendSource.update({
        where: { id: source.id },
        data: { personId: person.id },
      });
      stats.friendSourcesLinked++;
    }

    // Create CircleMembership
    const existing = await prisma.circleMembership.findUnique({
      where: {
        userId_personId: { userId: data.userId, personId: person.id },
      },
    });

    if (!existing) {
      await prisma.circleMembership.create({
        data: {
          userId: data.userId,
          personId: person.id,
        },
      });
      stats.membershipsCreated++;
    }
  }

  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  try {
    const stats = await migrateCircle(dryRun);

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Complete!');
    console.log('='.repeat(50));
    console.log(`Persons created:       ${stats.personsCreated}`);
    console.log(`RSS sources linked:    ${stats.rssSourcesLinked}`);
    console.log(`Friend sources linked: ${stats.friendSourcesLinked}`);
    console.log(`Memberships created:   ${stats.membershipsCreated}`);
    console.log(`Duplicates merged:     ${stats.duplicatesFound}`);
    console.log('='.repeat(50) + '\n');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
