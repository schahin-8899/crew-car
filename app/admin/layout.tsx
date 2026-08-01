import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/server';
import AdminNav from './admin-nav';

// The admin section always reads the auth cookie to check who's signed
// in, so it can never be statically pre-rendered — scoped here rather
// than at the root layout, which conflicts with Next's internal pages.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login');
  if (!profile.is_admin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-paper">
      <AdminNav />
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
