/**
 * Circle Service
 *
 * The circle is person-based, not source-based.
 * A Person can have multiple Sources.
 * A User trusts a Person via CircleMembership.
 *
 * This is the canonical query for "Your Circle".
 * All UI rendering must go through this.
 */

import { prisma } from '@/lib/prisma';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type PersonStatus = 'ACTIVE' | 'QUIET' | 'WARNING' | 'PAUSED' | 'MUTED';

export interface CircleSource {
  id: string;
  type: 'RSS' | 'GOODREADS' | 'IMPORT';
  url: string | null;
  status: string;
  failureReasonCode: string | null;
  lastSuccessAt: Date | null;
  lastAttemptAt: Date | null;
}

export interface CirclePerson {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  status: PersonStatus;
  isMuted: boolean;
  trustedSince: Date;

  // Impact stats
  booksSurfaced: number;
  booksInCanon: number;
  lastSignalAt: Date | null;
  lastSignalBookTitle: string | null;

  // Sources (for Manage drawer)
  sources: CircleSource[];
}

export interface CircleSummary {
  peopleCount: number;
  sourceCount: number;
  lastSignalAt: Date | null;
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function inferSourceType(url: string | null): 'RSS' | 'GOODREADS' | 'IMPORT' {
  if (!url) return 'IMPORT';
  if (url.includes('goodreads.com')) return 'GOODREADS';
  return 'RSS';
}

/**
 * Compute person status from their sources
 * Priority: MUTED > ACTIVE > WARNING > PAUSED > QUIET
 */
function computePersonStatus(
  sources: Array<{ status: string; lastSuccessAt: Date | null }>,
  isMuted: boolean,
  lastSignalAt: Date | null
): PersonStatus {
  if (isMuted) return 'MUTED';

  const enabledSources = sources.filter(
    (s) => s.status !== 'PAUSED' && s.status !== 'DISABLED'
  );

  if (enabledSources.length === 0) return 'PAUSED';

  const hasActive = enabledSources.some((s) => s.status === 'ACTIVE');
  const hasWarning = enabledSources.some(
    (s) => s.status === 'WARNING' || s.status === 'BACKOFF'
  );
  const hasFailed = enabledSources.some((s) => s.status === 'FAILED');

  if (hasActive) {
    // Check if quiet (no signals in 90 days)
    if (lastSignalAt) {
      const daysSinceSignal = Math.floor(
        (Date.now() - lastSignalAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceSignal > 90) return 'QUIET';
    }
    return 'ACTIVE';
  }

  if (hasWarning || hasFailed) return 'WARNING';

  return 'QUIET';
}

// ═══════════════════════════════════════════════════════════════════
// Core API
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all people in a user's circle with computed status
 * This is THE canonical query for circle display.
 */
export async function getCirclePeople(userId: string): Promise<CirclePerson[]> {
  // Get all circle memberships for this user
  const memberships = await prisma.circleMembership.findMany({
    where: { userId },
    include: {
      person: {
        include: {
          rssSources: {
            where: { userId },
            select: {
              id: true,
              url: true,
              status: true,
              failureReasonCode: true,
              lastSuccessAt: true,
              lastAttemptAt: true,
            },
          },
          friendSources: {
            where: { userId },
            select: {
              id: true,
              rssUrl: true,
              sourceType: true,
              active: true,
              lastFetchedAt: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // For each person, compute their impact stats
  const people: CirclePerson[] = await Promise.all(
    memberships.map(async (m) => {
      const person = m.person;
      const isMuted = m.mutedAt !== null;

      // Combine all sources for this person
      const sources: CircleSource[] = [
        ...person.rssSources.map((s) => ({
          id: s.id,
          type: inferSourceType(s.url),
          url: s.url,
          status: s.status,
          failureReasonCode: s.failureReasonCode,
          lastSuccessAt: s.lastSuccessAt,
          lastAttemptAt: s.lastAttemptAt,
        })),
        ...person.friendSources.map((s) => ({
          id: s.id,
          type: (s.sourceType === 'import' ? 'IMPORT' : 'GOODREADS') as 'IMPORT' | 'GOODREADS',
          url: s.rssUrl,
          status: s.active ? 'ACTIVE' : 'PAUSED',
          failureReasonCode: null,
          lastSuccessAt: s.lastFetchedAt,
          lastAttemptAt: s.lastFetchedAt,
        })),
      ];

      // Get impact stats - books surfaced from this person
      // This counts FriendFiveStarEvents where the friendName matches
      const events = await prisma.friendFiveStarEvent.findMany({
        where: {
          userId,
          friendName: { equals: person.displayName, mode: 'insensitive' },
        },
        select: {
          id: true,
          createdAt: true,
          book: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      const booksSurfaced = await prisma.friendFiveStarEvent.count({
        where: {
          userId,
          friendName: { equals: person.displayName, mode: 'insensitive' },
        },
      });

      // Count how many of this person's books are in canon
      const booksInCanon = await prisma.canonEntry.count({
        where: {
          userBook: {
            userId,
            sourcePersonName: { equals: person.displayName, mode: 'insensitive' },
          },
          removedAt: null,
        },
      });

      const lastEvent = events[0];
      const lastSignalAt = lastEvent?.createdAt || null;
      const lastSignalBookTitle = lastEvent?.book?.title || null;

      const status = computePersonStatus(
        sources.map((s) => ({
          status: s.status,
          lastSuccessAt: s.lastSuccessAt,
        })),
        isMuted,
        lastSignalAt
      );

      return {
        id: person.id,
        displayName: person.displayName,
        avatarUrl: person.avatarUrl,
        status,
        isMuted,
        trustedSince: m.createdAt,
        booksSurfaced,
        booksInCanon,
        lastSignalAt,
        lastSignalBookTitle,
        sources,
      };
    })
  );

  return people;
}

/**
 * Get circle summary for header display
 */
export async function getCircleSummary(userId: string): Promise<CircleSummary> {
  const memberships = await prisma.circleMembership.findMany({
    where: { userId },
    include: {
      person: {
        include: {
          rssSources: { where: { userId }, select: { id: true } },
          friendSources: { where: { userId }, select: { id: true } },
        },
      },
    },
  });

  const peopleCount = memberships.length;
  const sourceCount = memberships.reduce(
    (sum, m) => sum + m.person.rssSources.length + m.person.friendSources.length,
    0
  );

  // Get most recent signal
  const lastEvent = await prisma.friendFiveStarEvent.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  return {
    peopleCount,
    sourceCount,
    lastSignalAt: lastEvent?.createdAt || null,
  };
}

/**
 * Get circle people names for inline display (e.g., "Ken · Laura · Mom")
 * Returns only active/warning people, deduped by person
 */
export async function getCircleNames(userId: string): Promise<string[]> {
  const people = await getCirclePeople(userId);

  return people
    .filter((p) => p.status !== 'MUTED' && p.status !== 'PAUSED')
    .map((p) => p.displayName);
}

// ═══════════════════════════════════════════════════════════════════
// Mutations
// ═══════════════════════════════════════════════════════════════════

/**
 * Find or create a Person by name, then add to circle
 */
export async function addPersonToCircle(
  userId: string,
  displayName: string,
  options?: {
    avatarUrl?: string;
    rssUrl?: string;
  }
): Promise<{ person: { id: string; displayName: string }; isNew: boolean }> {
  const normalized = normalizeName(displayName);

  // Find or create person
  let person = await prisma.person.findFirst({
    where: { normalizedName: normalized },
  });

  const isNew = !person;

  if (!person) {
    person = await prisma.person.create({
      data: {
        displayName,
        normalizedName: normalized,
        avatarUrl: options?.avatarUrl,
      },
    });
  }

  // Create circle membership (will fail silently if already exists)
  await prisma.circleMembership.upsert({
    where: {
      userId_personId: { userId, personId: person.id },
    },
    create: { userId, personId: person.id },
    update: {}, // No-op if exists
  });

  // If RSS URL provided, create RssSource linked to this person
  if (options?.rssUrl) {
    await prisma.rssSource.upsert({
      where: {
        userId_url: { userId, url: options.rssUrl },
      },
      create: {
        userId,
        personId: person.id,
        url: options.rssUrl,
        title: displayName,
        status: 'DRAFT',
      },
      update: {
        personId: person.id,
      },
    });
  }

  return { person: { id: person.id, displayName: person.displayName }, isNew };
}

/**
 * Remove person from circle
 */
export async function removePersonFromCircle(
  userId: string,
  personId: string,
  options?: { removeAllSources?: boolean }
): Promise<void> {
  // Delete circle membership
  await prisma.circleMembership.deleteMany({
    where: { userId, personId },
  });

  // Optionally remove all sources for this person
  if (options?.removeAllSources) {
    await prisma.rssSource.deleteMany({
      where: { userId, personId },
    });
    await prisma.friendSource.deleteMany({
      where: { userId, personId },
    });
  }
}

/**
 * Mute/unmute a person
 */
export async function setPersonMuted(
  userId: string,
  personId: string,
  muted: boolean
): Promise<void> {
  await prisma.circleMembership.update({
    where: {
      userId_personId: { userId, personId },
    },
    data: {
      mutedAt: muted ? new Date() : null,
    },
  });
}

export { normalizeName };
