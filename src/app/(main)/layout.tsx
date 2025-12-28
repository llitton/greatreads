import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { MainLayout } from '@/components/layout/main-layout';

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Right sidebar always present - it shows contextual content per page
  return <MainLayout>{children}</MainLayout>;
}
