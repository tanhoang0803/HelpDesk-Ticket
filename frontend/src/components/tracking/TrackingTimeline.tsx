import { TrackingLog } from '@/types/ticket.types';
import { TrackingEntry } from './TrackingEntry';

export function TrackingTimeline({ logs }: { logs: TrackingLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No tracking history yet.</p>;
  }
  return (
    <div>
      {logs.map((log, i) => (
        <TrackingEntry key={log.id} log={log} isLast={i === logs.length - 1} />
      ))}
    </div>
  );
}
