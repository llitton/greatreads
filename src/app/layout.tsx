import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const merriweather = Merriweather({
  variable: '--font-merriweather',
  weight: ['400', '700', '900'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GreatReads - Discover 5-Star Books from Friends',
  description:
    'See what books your friends are loving. Get notified when they give 5 stars. Build your Top 10 list.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
