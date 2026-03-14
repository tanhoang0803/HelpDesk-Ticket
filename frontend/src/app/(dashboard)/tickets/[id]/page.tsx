'use client';

import { useTicket, useTransitionTicket, useAddComment } from '@/hooks/useTickets';
import { useAttachments } from '@/hooks/useAttachments';
import { TrackingTimeline } from '@/components/tracking/TrackingTimeline';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge';
import { AttachmentList } from '@/components/attachments/AttachmentList';
import { AttachmentUpload } from '@/components/attachments/AttachmentUpload';
import { formatDateTime } from '@/lib/utils/date';
import { ALLOWED_TRANSITIONS, STATUS_LABELS } from '@/lib/utils/ticket-status';
import { useState } from 'react';

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const { data: ticket, isLoading, error } = useTicket(params.id);
  const { data: attachments = [] } = useAttachments(params.id);
  const transition = useTransitionTicket(params.id);
  const addComment = useAddComment(params.id);
  const [comment,           setComment]           = useState('');
  const [transitionStatus,  setTransitionStatus]  = useState('');
  const [transitionComment, setTransitionComment] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-32 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
        Failed to load ticket. {(error as Error)?.message}
      </div>
    );
  }

  const allowedNext = ALLOWED_TRANSITIONS[ticket.status] ?? [];

  const handleTransition = async () => {
    if (!transitionStatus) return;
    await transition.mutateAsync({ status: transitionStatus, comment: transitionComment });
    setTransitionStatus('');
    setTransitionComment('');
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await addComment.mutateAsync(comment);
    setComment('');
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-sm text-gray-400">{ticket.ticketNumber}</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-500">{ticket.department.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
          <span className="text-sm text-gray-500">{ticket.ticketType.name}</span>
          <span className="text-sm text-gray-300">·</span>
          <span className="text-sm text-gray-500">{ticket.category.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Activity</h2>
            <TrackingTimeline logs={ticket.trackingLogs ?? []} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Attachments ({attachments.length})</h2>
              <AttachmentUpload ticketId={params.id} />
            </div>
            <AttachmentList ticketId={params.id} attachments={attachments} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Comment</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Write a comment…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={handleComment}
              disabled={!comment.trim() || addComment.isPending}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {addComment.isPending ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">Assigned To</dt>
                <dd className="text-gray-700 mt-0.5">{ticket.assignedTo?.name ?? 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">Created</dt>
                <dd className="text-gray-700 mt-0.5">{formatDateTime(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">Updated</dt>
                <dd className="text-gray-700 mt-0.5">{formatDateTime(ticket.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {allowedNext.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Change Status</h2>
              <select
                value={transitionStatus}
                onChange={(e) => setTransitionStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
              >
                <option value="">Select new status…</option>
                {allowedNext.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              {transitionStatus && (
                <textarea
                  value={transitionComment}
                  onChange={(e) => setTransitionComment(e.target.value)}
                  rows={2}
                  placeholder="Optional comment…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
                />
              )}
              <button
                onClick={handleTransition}
                disabled={!transitionStatus || transition.isPending}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {transition.isPending ? 'Updating…' : 'Apply'}
              </button>
              {transition.isError && (
                <p className="text-xs text-red-600 mt-1">{(transition.error as Error)?.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
