# GreatReads 📚

A better way to discover 5-star books from your friends. GreatReads monitors Goodreads RSS feeds and notifies you when friends give books 5-star ratings.

## Features

- **5-Star Feed**: See a rolling feed of books your friends love
- **Notifications**: Get email and SMS alerts for new 5-star ratings
- **Reading Tracker**: Mark books as read, add your own ratings and notes
- **Top 10 List**: Create and share your favorite books with drag-and-drop ordering
- **Friend Requests**: Ask friends for their Top 10 books via email

## Tech Stack (100% Free Tier)

| Layer | Service | Free Tier |
|-------|---------|-----------|
| **Database** | Neon (Postgres) | 0.5 GB storage |
| **Auth** | NextAuth + Resend | Magic link emails |
| **ORM** | Prisma | - |
| **Email** | Resend | 3,000/month |
| **SMS** | Twilio (optional) | Pay as you go |
| **Deploy** | Vercel Hobby | Unlimited sites |

## Quick Start

### 1. Create Free Accounts

1. **Neon** (database): https://console.neon.tech
2. **Resend** (email): https://resend.com
3. **Vercel** (hosting): https://vercel.com

### 2. Clone and Install

```bash
git clone https://github.com/llitton/greatreads.git
cd greatreads
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Neon Database (from console.neon.tech → Connection Details)
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Resend (from resend.com/api-keys)
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="GreatReads <onboarding@resend.dev>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="any-random-string"
```

### 4. Set Up Database

```bash
npm run db:push
```

### 5. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

### 1. Push to GitHub

The repo is already at: https://github.com/llitton/greatreads

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `greatreads` repo
3. Add environment variables (same as above, but update URLs):
   - `NEXTAUTH_URL` → your Vercel URL
   - `NEXT_PUBLIC_APP_URL` → your Vercel URL
4. Deploy!

### 3. Cron Job

The RSS poll runs daily at 8:00 AM UTC (Vercel Hobby limit). Upgrade to Pro for more frequent polling.

## Finding Goodreads RSS Feeds

1. Go to your friend's Goodreads profile
2. Find "Recent Updates" or their bookshelf
3. Look for the RSS icon (🔶)
4. Copy the URL

Common patterns:
- `https://www.goodreads.com/user/updates_rss/[USER_ID]`
- `https://www.goodreads.com/review/list_rss/[USER_ID]?shelf=read`

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run test         # Run tests
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Redirect to feed or login |
| `/login` | Email magic link auth |
| `/feed` | 5-star books from friends |
| `/my-books` | Personal reading tracker |
| `/top10` | Your Top 10 list |
| `/settings` | Notification preferences |
| `/mark` | Gift landing page |
| `/u/[id]/top10` | Public Top 10 share |

---

Built with ❤️ for Mark Thomas Litton
