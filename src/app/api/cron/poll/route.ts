import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAndParseRSS } from '@/lib/rss/parser';
import { sendEmailNotification, sendSMSNotification } from '@/lib/notifications';

// Vercel Cron configuration
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

async function findOrCreateBook(event: {
  bookTitle: string;
  bookAuthor: string | null;
  goodreadsBookUrl: string | null;
  coverUrl: string | null;
}) {
  // Try to find existing book by title and author
  let book = await prisma.book.findFirst({
    where: {
      title: event.bookTitle,
      author: event.bookAuthor,
    },
  });

  if (!book) {
    book = await prisma.book.create({
      data: {
        title: event.bookTitle,
        author: event.bookAuthor,
        goodreadsBookUrl: event.goodreadsBookUrl,
        coverUrl: event.coverUrl,
      },
    });
  } else if (!book.coverUrl && event.coverUrl) {
    // Update cover if we have one now
    book = await prisma.book.update({
      where: { id: book.id },
      data: { coverUrl: event.coverUrl },
    });
  }

  return book;
}

export async function GET(request: NextRequest) {
  // RSS polling is disabled - using CSV import instead
  // Keep this code for potential future use, but return early
  const RSS_POLLING_ENABLED = false;

  if (!RSS_POLLING_ENABLED) {
    return NextResponse.json({
      success: true,
      message: 'RSS polling is disabled. Use CSV import instead.',
      sourcesPolled: 0,
      newEventsFound: 0,
      notificationsSent: 0,
    });
  }

  const startTime = Date.now();
  const errors: Array<{ sourceId: string; error: string }> = [];
  let sourcesPolled = 0;
  let newEventsFound = 0;
  let notificationsSent = 0;

  // Verify cron secret for security (Vercel sends this header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all active friend sources
    const sources = await prisma.friendSource.findMany({
      where: { active: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            notifyEmail: true,
            notifySms: true,
          },
        },
      },
    });

    console.log(`Polling ${sources.length} active sources`);

    for (const source of sources) {
      try {
        // Skip sources without RSS URL (import-based sources)
        if (!source.rssUrl) {
          continue;
        }

        sourcesPolled++;

        const result = await fetchAndParseRSS(
          source.rssUrl,
          source.label,
          source.lastEtag,
          source.lastModified
        );

        // Update source metadata
        await prisma.friendSource.update({
          where: { id: source.id },
          data: {
            lastFetchedAt: new Date(),
            lastEtag: result.etag,
            lastModified: result.lastModified,
          },
        });

        if (result.notModified) {
          console.log(`Source ${source.id} (${source.label}): not modified`);
          continue;
        }

        console.log(`Source ${source.id} (${source.label}): found ${result.items.length} 5-star events`);

        // Process each 5-star event
        for (const event of result.items) {
          // Check if we already have this event
          const existing = await prisma.friendFiveStarEvent.findUnique({
            where: { externalGuid: event.externalGuid },
          });

          if (existing) {
            continue; // Skip duplicate
          }

          // Find or create the book
          const book = await findOrCreateBook(event);

          // Create the event
          await prisma.friendFiveStarEvent.create({
            data: {
              userId: source.userId,
              friendSourceId: source.id,
              externalGuid: event.externalGuid,
              bookId: book.id,
              friendName: event.friendName,
              rating: event.rating,
              reviewText: event.reviewText,
              eventUrl: event.eventUrl,
              eventDate: event.eventDate,
              rawPayload: event.rawPayload as object,
            },
          });

          newEventsFound++;

          // Send notifications
          const user = source.user;
          const notificationPayload = {
            userId: user.id,
            bookTitle: event.bookTitle,
            bookAuthor: event.bookAuthor,
            friendName: event.friendName,
            eventUrl: event.eventUrl,
          };

          if (user.notifyEmail && user.email) {
            const sent = await sendEmailNotification(notificationPayload, user.email);
            if (sent) notificationsSent++;
          }

          if (user.notifySms && user.phone) {
            const sent = await sendSMSNotification(notificationPayload, user.phone);
            if (sent) notificationsSent++;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing source ${source.id}:`, errorMessage);
        errors.push({ sourceId: source.id, error: errorMessage });
      }
    }

    const duration = Date.now() - startTime;

    // Log the cron run
    await prisma.cronLog.create({
      data: {
        sourcesPolled,
        newEventsFound,
        notificationsSent,
        errors: errors.length > 0 ? errors : undefined,
        duration,
      },
    });

    return NextResponse.json({
      success: true,
      sourcesPolled,
      newEventsFound,
      notificationsSent,
      errors: errors.length,
      duration: `${duration}ms`,
    });
  } catch (error) {
    console.error('Cron job failed:', error);

    await prisma.cronLog.create({
      data: {
        sourcesPolled,
        newEventsFound,
        notificationsSent,
        errors: [{ error: error instanceof Error ? error.message : 'Unknown error' }],
        duration: Date.now() - startTime,
      },
    });

    return NextResponse.json(
      { error: 'Cron job failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
