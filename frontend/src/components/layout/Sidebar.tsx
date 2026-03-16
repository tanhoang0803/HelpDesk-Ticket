'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',  icon: '🏠' },
  { href: '/tickets',     label: 'Tickets',     icon: '🎫' },
  { href: '/tickets/new', label: 'New Ticket',  icon: '➕' },
];

const adminItems = [
  { href: '/admin/analytics',    label: 'Analytics',    icon: '📊' },
  { href: '/admin/agents',       label: 'Agents',       icon: '👥' },
  { href: '/admin/departments',  label: 'Departments',  icon: '🏢' },
  { href: '/admin/categories',   label: 'Categories',   icon: '🏷️' },
  { href: '/admin/ticket-types', label: 'Ticket Types', icon: '📋' },
];

export function Sidebar() {
  const pathname   = usePathname();
  const { data: session } = useSession();
  const role       = session?.user?.role;
  const isAdmin    = role === 'ADMIN' || role === 'SUPERVISOR';

  const isActive = (href: string) =>
    href === '/tickets' ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="px-5 py-5 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">🎫 HelpDesk</h1>
        <p className="text-xs text-gray-400 mt-0.5">Ticketing System</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <p className="text-xs text-gray-500 uppercase tracking-wider px-3 pt-4 pb-1">Admin</p>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
