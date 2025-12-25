# Product Notes

## Overview

GreatReads solves a simple problem: discovering great books through trusted recommendations. Instead of browsing endless book lists or relying on algorithms, GreatReads shows you what your actual friends are loving.

## Core Heuristics

### 5-Star Detection

We use multiple patterns to detect 5-star ratings from Goodreads RSS feeds:

1. **Explicit Rating Field** (most reliable)
   - Shelf RSS feeds include `<user_rating>5</user_rating>`
   - This is the most accurate method

2. **Text Pattern Matching**
   - "rated it 5 out of 5 stars"
   - "gave it 5 stars"
   - "★★★★★" (star emoji)
   - "[5 stars]"

3. **Fallback Behavior**
   - If we can't determine the rating, we skip the item
   - False negatives are preferred over false positives

### Book Identification

Books are identified by:
1. Title (required)
2. Author (optional but used for matching)
3. Goodreads Book URL (for linking back)

We intentionally don't use ISBN matching because:
- Not all RSS items include ISBN
- Title+Author matching is sufficient for this use case
- Avoids complexity of ISBN variations

## Tradeoffs

### RSS vs API

**Why RSS instead of Goodreads API?**
- Goodreads stopped issuing new API keys
- RSS feeds are public and reliable
- No rate limiting concerns
- Simple implementation

**Limitations:**
- Can't get historical data (RSS is recent only)
- Limited metadata (no full reviews)
- Requires users to find RSS URLs manually

### Polling vs Webhooks

**We use polling (cron) because:**
- RSS doesn't support webhooks
- 30-minute intervals provide near-real-time updates
- Simple and reliable

**Trade-off:**
- Slight delay in notifications (up to 30 min)
- Server costs for polling (minimal on Vercel)

### Simple vs Smart Matching

**We use simple title+author matching:**
- Fast and predictable
- Works well for most cases

**What we don't do:**
- Fuzzy matching (could match wrong books)
- ISBN lookup (adds complexity)
- Cover image fetching (use RSS-provided only)

## Design Decisions

### Warm, Bookish Aesthetic

The UI intentionally evokes a cozy bookshop feel:
- Cream and brown color palette
- Serif headings (Merriweather)
- Soft shadows and rounded corners
- Book cover imagery where available

This differentiates from Goodreads' more utilitarian design while maintaining familiarity.

### Feed-First Experience

The main experience is a chronological feed because:
- It's intuitive (like social media)
- Shows freshest content first
- Easy to scan and take action

### Single Top 10 List

We limit users to one Top 10 list:
- Simpler mental model
- Forces meaningful curation
- Easy to share one link

Future: Could add themed lists if users request.

### Magic Link Auth

We use email magic links instead of passwords because:
- No password to remember/manage
- Secure by default
- Simple implementation
- Aligns with "lightweight" app philosophy

## Notification Strategy

### Rate Limiting

5 notifications per hour maximum:
- Prevents spam during batch RSS imports
- Balances immediacy with inbox respect
- Can be increased per user if needed

### Email Design

Notifications include:
- Friend name (social proof)
- Book title and author
- Direct link to GreatReads
- Link to Goodreads (for more info)

### SMS (Optional)

SMS is opt-in and requires phone number:
- More immediate than email
- Good for power users
- Kept brief (character limits)

## Gift Experience (/mark)

The special landing page for Mark Thomas Litton:
- Personal welcome message
- Clear value proposition
- Streamlined signup flow
- Warm, gift-like presentation

## Future Improvements

### Near-term
- [ ] Daily digest option
- [ ] Quiet hours
- [ ] Better mobile experience
- [ ] Friend source editing

### Medium-term
- [ ] Book search (add books manually)
- [ ] Multiple Top 10 lists
- [ ] Reading goals/stats
- [ ] Export data

### Long-term
- [ ] Follow other GreatReads users
- [ ] Reading clubs
- [ ] Mobile apps
- [ ] Goodreads OAuth (if available)

## Metrics to Track

If implementing analytics:
- Active users (daily/weekly)
- RSS feeds added per user
- Books marked as read
- Top 10 lists shared
- Top 10 requests sent/completed
- Notification engagement
