import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR') redirect('/dashboard');
  return <>{children}</>;
}
