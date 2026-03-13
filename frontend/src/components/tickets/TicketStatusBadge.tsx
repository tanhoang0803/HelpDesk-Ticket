import { TicketStatus } from '@/types/ticket.types';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/ticket-status';

interface Props {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function TicketStatusBadge({ status, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
