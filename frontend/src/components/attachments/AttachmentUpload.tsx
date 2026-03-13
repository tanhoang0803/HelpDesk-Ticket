'use client';

import { useRef, useState } from 'react';
import { useUploadAttachment } from '@/hooks/useAttachments';

interface Props { ticketId: string }

export function AttachmentUpload({ ticketId }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const upload = useUploadAttachment(ticketId);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10 MB');
      return;
    }
    setError('');
    await upload.mutateAsync(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
        <span>📎</span>
        <span>{upload.isPending ? 'Uploading…' : 'Attach file'}</span>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={upload.isPending}
        />
      </label>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {upload.isError && (
        <p className="text-xs text-red-600 mt-1">
          {(upload.error as Error)?.message ?? 'Upload failed'}
        </p>
      )}
    </div>
  );
}
