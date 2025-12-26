import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Resend from 'next-auth/providers/resend';
import { Resend as ResendClient } from 'resend';
import { prisma } from './prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || 'Laura <noreply@greatreads.app>',
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const resend = new ResendClient(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: provider.from || 'Laura <noreply@greatreads.app>',
          to: email,
          subject: "Laura made something for you 📚",
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; background:#faf7f2; padding:32px;">
              <h2 style="color:#3b2a1a;">Hi there,</h2>

              <p>I made something for you.</p>

              <p>
                GreatReads collects the <strong>5-star books</strong> your friends love,
                so your next great read always comes from someone you trust.
              </p>

              <p style="margin: 24px 0;">
                <a href="${url}"
                   style="background:#3b2a1a; color:#fff; padding:12px 18px; border-radius:6px; text-decoration:none;">
                  Sign in to GreatReads
                </a>
              </p>

              <p style="color:#666; font-size:14px;">
                This link is private and expires soon.
              </p>

              <p style="margin-top:32px;">— Laura</p>
            </div>
          `,
          text: `Hi there,

I made something for you.

GreatReads collects the 5-star books your friends love,
so your next great read always comes from someone you trust.

Sign in here:
${url}

— Laura`,
        });
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
    error: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user }) {
      // Allow all sign-ins
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Check if this is Mark's special email and mark as gift user
      if (user.email?.toLowerCase().includes('mark') || user.email?.toLowerCase().includes('litton')) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isGiftUser: true },
        });
      }
    },
  },
  session: {
    strategy: 'database',
  },
});
