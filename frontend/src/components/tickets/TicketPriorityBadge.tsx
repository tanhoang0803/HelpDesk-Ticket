import { Priority } from '@/types/ticket.types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/utils/ticket-status';

interface Props {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function TicketPriorityBadge({ priority, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${PRIORITY_COLORS[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
