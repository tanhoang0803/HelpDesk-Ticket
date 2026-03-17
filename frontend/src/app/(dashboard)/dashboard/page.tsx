import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardTicketsTable } from '@/components/dashboard/DashboardTicketsTable';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening in your queue</p>
      </div>

      <DashboardStats />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Link href="/tickets" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            View All Tickets
          </Link>
          <Link href="/tickets/new" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Create Ticket
          </Link>
        </div>
      </div>

      <DashboardTicketsTable />
    </div>
  );
}
