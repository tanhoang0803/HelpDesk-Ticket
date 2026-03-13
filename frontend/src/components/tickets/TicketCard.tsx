import Link from 'next/link';
import { Ticket } from '@/types/ticket.types';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { formatDateTime } from '@/lib/utils/date';

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link href={`/tickets/${ticket.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{ticket.department.name}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 truncate">{ticket.title}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <TicketStatusBadge status={ticket.status} size="sm" />
              <TicketPriorityBadge priority={ticket.priority} size="sm" />
              <span className="text-xs text-gray-400">{ticket.category.name}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">{formatDateTime(ticket.createdAt)}</p>
            {ticket.assignedTo && (
              <p className="text-xs text-gray-500 mt-1">{ticket.assignedTo.name}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
