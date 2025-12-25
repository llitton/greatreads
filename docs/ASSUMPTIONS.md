# Assumptions

This document outlines the assumptions made during the development of GreatReads.

## RSS Feed Assumptions

### Goodreads RSS Structure

1. **Two main RSS feed types are supported:**
   - User updates feed: `https://www.goodreads.com/user/updates_rss/[USER_ID]`
   - Shelf feed: `https://www.goodreads.com/review/list_rss/[USER_ID]?shelf=read`

2. **Rating detection patterns:**
   - Shelf feeds include `<user_rating>` custom field (most reliable)
   - Update feeds use text patterns like "rated it 5 out of 5 stars"
   - Star emoji patterns (★★★★★) are also detected

3. **Deduplication:**
   - We use the RSS `<guid>` if present
   - Otherwise, we generate a stable hash from URL + title + date
   - This prevents duplicate notifications

### Feed Accessibility

1. **Public Profiles**: We assume users only add RSS feeds for public Goodreads profiles
2. **No Scraping**: We explicitly do NOT scrape HTML pages, only consume public RSS
3. **User Responsibility**: Users are informed they should only add feeds they have permission to access

## Authentication Assumptions

1. **Email-Only Auth**: MVP uses email magic links only (no OAuth)
2. **Trusted Emails**: We assume users enter their own email addresses
3. **Session Duration**: Default NextAuth session handling (database sessions)

## Notification Assumptions

1. **Rate Limiting**: Maximum 5 notifications per user per hour
2. **No Batching**: Notifications are sent immediately (no daily digest)
3. **No Quiet Hours**: MVP does not implement quiet hours (noted as future feature)

## Data Model Assumptions

1. **Book Deduplication**: Books are matched by title + author combination
2. **No ISBN Lookup**: We don't fetch additional book metadata from external APIs
3. **Cover Images**: We use Goodreads-provided cover URLs when available

## User Experience Assumptions

1. **Single Top 10**: Each user has one Top 10 list (not multiple lists)
2. **Public Sharing**: Top 10 lists are public by default when shared
3. **Guest Responses**: Top 10 request recipients can respond without creating an account

## Technical Assumptions

1. **Vercel Hosting**: The app is designed for Vercel deployment (Hobby tier)
2. **Neon Database**: PostgreSQL via Neon (free tier: 0.5 GB storage)
3. **Cron Interval**: Daily polling on Vercel Hobby (upgrade to Pro for 30-min polling)

## Gift Experience (Mark Thomas Litton)

1. **Single Gift Recipient**: The `/mark` route is hardcoded for one recipient
2. **No Gift Codes**: Access is by URL, not by code
3. **Auto-Recognition**: Users with "mark" or "litton" in their email are flagged as gift users

## Future Considerations

These features were considered but deferred from MVP:

1. **Quiet Hours**: Let users set notification-free periods
2. **Daily Digest**: Batch notifications into a daily email
3. **Multiple Top 10 Lists**: Allow themed lists (Best Sci-Fi, etc.)
4. **Book Search**: Add books from external API (Google Books, Open Library)
5. **Social Features**: Follow other GreatReads users
6. **Mobile App**: Native iOS/Android apps
7. **Goodreads OAuth**: If Goodreads ever re-opens their API
