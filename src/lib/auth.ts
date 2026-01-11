import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Resend from 'next-auth/providers/resend';
import Credentials from 'next-auth/providers/credentials';
import { Resend as ResendClient } from 'resend';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || 'Laura <noreply@greatreads.app>',
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const resend = new ResendClient(process.env.RESEND_API_KEY);

        try {
          const result = await resend.emails.send({
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

          if (result.error) {
            console.error('Failed to send verification email:', result.error);
            throw new Error(`Email send failed: ${result.error.message}`);
          }

          console.log('Verification email sent successfully to:', email);
        } catch (error) {
          console.error('Error sending verification email to', email, ':', error);
          throw error;
        }
      },
    }),
    Credentials({
      name: 'Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
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
    strategy: 'jwt',
  },
});
