import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Resend from 'next-auth/providers/resend';
import { prisma } from './prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM || 'noreply@greatreads.app',
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
