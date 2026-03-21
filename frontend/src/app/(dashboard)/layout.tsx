import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-60 min-h-screen">
        <main className="flex-1 p-8">
          {children}
        </main>
        <footer className="px-8 py-4 text-center text-xs text-gray-400 border-t border-gray-200">
          &copy; 2026 TanQHoang. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
