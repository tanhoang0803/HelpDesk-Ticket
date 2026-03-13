import { TrackingLog } from '@/types/ticket.types';
import { formatDateTime } from '@/lib/utils/date';

const ACTION_ICONS: Record<string, string> = {
  CREATED:    '🎫',
  ASSIGNED:   '👤',
  REASSIGNED: '🔄',
  IN_PROGRESS:'⚙️',
  PENDING:    '⏳',
  COMMENTED:  '💬',
  ESCALATED:  '🔺',
  RESOLVED:   '✅',
  VERIFIED:   '🔒',
  REOPENED:   '🔓',
  CANCELLED:  '❌',
  CLOSED:     '🏁',
};

export function TrackingEntry({ log, isLast }: { log: TrackingLog; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base shrink-0">
          {ACTION_ICONS[log.action] ?? '•'}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
      </div>
      <div className="pb-6 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800 capitalize">
            {log.action.replace(/_/g, ' ').toLowerCase()}
          </span>
          <span className="text-xs text-gray-400 shrink-0">{formatDateTime(log.createdAt)}</span>
        </div>
        {log.agent && <p className="text-xs text-gray-500 mt-0.5">{log.agent.name}</p>}
        {log.comment && (
          <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-md px-3 py-2 border border-gray-100">
            {log.comment}
          </p>
        )}
        {log.verified && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 mt-1">
            ✓ Verified
          </span>
        )}
      </div>
    </div>
  );
}
