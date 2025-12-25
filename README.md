# GreatReads 📚

A better way to discover 5-star books from your friends. GreatReads monitors Goodreads RSS feeds and notifies you when friends give books 5-star ratings.

## Features

- **5-Star Feed**: See a rolling feed of books your friends love
- **Notifications**: Get email and SMS alerts for new 5-star ratings
- **Reading Tracker**: Mark books as read, add your own ratings and notes
- **Top 10 List**: Create and share your favorite books with drag-and-drop ordering
- **Friend Requests**: Ask friends for their Top 10 books via email

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Supabase
- **Auth**: NextAuth (Auth.js) with email magic links
- **Email**: Resend
- **SMS**: Twilio (optional)
- **Drag & Drop**: dnd-kit
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)
- A Resend account for email

### 1. Clone and Install

\`\`\`bash
git clone https://github.com/laura-7743/greatreads.git
cd greatreads
npm install
\`\`\`

### 2. Set Up Environment Variables

Copy the example environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in the required values:

\`\`\`env
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="GreatReads <noreply@yourdomain.com>"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cron Secret (for securing the poll endpoint)
CRON_SECRET="your-secret-key"
\`\`\`

### 3. Set Up Database

Push the Prisma schema to your database:

\`\`\`bash
npm run db:push
\`\`\`

Or run migrations:

\`\`\`bash
npm run db:migrate
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Deployment on Vercel

### 1. Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/laura-7743/greatreads.git
git push -u origin main
\`\`\`

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and import the repo
2. Add environment variables in the Vercel dashboard
3. Deploy!

### 3. Configure Cron Job

The \`vercel.json\` file is already configured to run the RSS poll every 30 minutes. Make sure your \`CRON_SECRET\` is set in Vercel environment variables.

## RSS Feed Setup

### Finding a Friend's RSS Feed

1. Go to your friend's Goodreads profile
2. Click on "Recent Updates" or their bookshelf
3. Look for the RSS icon (usually in the sidebar)
4. Copy the URL

Common RSS URL patterns:
- Updates: \`https://www.goodreads.com/user/updates_rss/[USER_ID]\`
- Shelf: \`https://www.goodreads.com/review/list_rss/[USER_ID]?shelf=read\`

### Testing an RSS Feed

Use the "Test RSS" button when adding a friend to verify:
- The feed is accessible
- 5-star ratings can be detected
- Books are properly parsed

## Troubleshooting

### RSS Feed Not Working

1. **Check the URL**: Make sure it's a valid Goodreads RSS URL
2. **Profile Privacy**: The user's profile must be public
3. **Feed Format**: We support both "updates" and "shelf" RSS formats

### No 5-Star Events Showing

1. **Recent Activity**: RSS feeds only show recent items
2. **Rating Detection**: Check the test results to see if ratings are detected
3. **Cron Job**: Manually trigger \`/api/cron/poll\` to test

### Email Not Sending

1. **Resend Config**: Verify your API key and sender email
2. **Rate Limits**: Check if you've hit the notification rate limit (5/hour)
3. **Logs**: Check Vercel function logs for errors

## Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
\`\`\`

## License

MIT

---

Built with ❤️ for Mark Thomas Litton
