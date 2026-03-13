'use client';

import { Attachment } from '@/types/ticket.types';
import { attachmentsService } from '@/services/attachments.service';
import { useDeleteAttachment } from '@/hooks/useAttachments';
import { formatDateTime } from '@/lib/utils/date';
import { useSession } from 'next-auth/react';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
  return '📎';
}

interface Props {
  ticketId: string;
  attachments: Attachment[];
}

export function AttachmentList({ ticketId, attachments }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const deleteAttachment = useDeleteAttachment(ticketId);

  if (attachments.length === 0) {
    return <p className="text-sm text-gray-400">No attachments yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{fileIcon(a.mimeType)}</span>
            <div className="min-w-0">
              <a
                href={attachmentsService.downloadUrl(a.id)}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium truncate block"
              >
                {a.originalName}
              </a>
              <p className="text-xs text-gray-400">
                {formatBytes(a.size)} · {a.uploadedBy.name} · {formatDateTime(a.createdAt)}
              </p>
            </div>
          </div>
          {(role === 'ADMIN' || a.uploadedBy.id === userId) && (
            <button
              onClick={() => deleteAttachment.mutate(a.id)}
              disabled={deleteAttachment.isPending}
              className="text-xs text-red-500 hover:text-red-700 shrink-0"
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
