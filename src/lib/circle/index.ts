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

// Simplified 3-state taxonomy (no ambiguity)
export type SourceStatusSimple = 'ACTIVE' | 'DELAYED' | 'NEEDS_ATTENTION';

// Person status is derived from their sources + mute state
export type PersonStatus = 'ACTIVE' | 'DELAYED' | 'NEEDS_ATTENTION' | 'MUTED';

export interface CircleSource {
  id: string;
  type: 'RSS' | 'GOODREADS' | 'IMPORT';
  url: string | null;
  status: SourceStatusSimple;
  healthReason: string | null;
  lastSuccessAt: Date | null;
  lastAttemptAt: Date | null;
  checkedAgo: string | null; // "14h ago", "3 days ago"
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
 * Map raw DB status to simplified 3-state taxonomy
 * - ACTIVE: Signals flowing normally
 * - DELAYED: Temporary issues, retrying automatically
 * - NEEDS_ATTENTION: Requires user action
 */
function mapToSourceStatus(rawStatus: string): SourceStatusSimple {
  switch (rawStatus) {
    case 'ACTIVE':
      return 'ACTIVE';
    case 'BACKOFF':
    case 'WARNING':
    case 'DRAFT':
      return 'DELAYED';
    case 'FAILED':
    case 'PAUSED':
    case 'DISABLED':
    default:
      return 'NEEDS_ATTENTION';
  }
}

/**
 * Format time ago for display ("14h ago", "3 days ago")
 */
function formatCheckedAgo(date: Date | null): string | null {
  if (!date) return null;

  const now = Date.now();
  const diff = now - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * Compute person status from their sources
 * Simplified 3-state: ACTIVE > DELAYED > NEEDS_ATTENTION (plus MUTED override)
 */
function computePersonStatus(
  sources: Array<{ status: SourceStatusSimple }>,
  isMuted: boolean
): PersonStatus {
  if (isMuted) return 'MUTED';
  if (sources.length === 0) return 'NEEDS_ATTENTION';

  // Person inherits best status from their sources
  const hasActive = sources.some((s) => s.status === 'ACTIVE');
  if (hasActive) return 'ACTIVE';

  const hasDelayed = sources.some((s) => s.status === 'DELAYED');
  if (hasDelayed) return 'DELAYED';

  return 'NEEDS_ATTENTION';
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

      // Combine all sources for this person with normalized status
      const sources: CircleSource[] = [
        ...person.rssSources.map((s) => ({
          id: s.id,
          type: inferSourceType(s.url),
          url: s.url,
          status: mapToSourceStatus(s.status),
          healthReason: s.failureReasonCode,
          lastSuccessAt: s.lastSuccessAt,
          lastAttemptAt: s.lastAttemptAt,
          checkedAgo: formatCheckedAgo(s.lastAttemptAt),
        })),
        ...person.friendSources.map((s) => ({
          id: s.id,
          type: (s.sourceType === 'import' ? 'IMPORT' : 'GOODREADS') as 'IMPORT' | 'GOODREADS',
          url: s.rssUrl,
          status: mapToSourceStatus(s.active ? 'ACTIVE' : 'PAUSED'),
          healthReason: null,
          lastSuccessAt: s.lastFetchedAt,
          lastAttemptAt: s.lastFetchedAt,
          checkedAgo: formatCheckedAgo(s.lastFetchedAt),
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
        sources.map((s) => ({ status: s.status })),
        isMuted
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
 * Returns only non-muted people, deduped by person
 */
export async function getCircleNames(userId: string): Promise<string[]> {
  const people = await getCirclePeople(userId);

  return people
    .filter((p) => p.status !== 'MUTED')
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
