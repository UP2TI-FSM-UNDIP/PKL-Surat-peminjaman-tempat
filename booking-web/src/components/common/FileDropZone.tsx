import { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export type FileDropZoneProps = {
  accept: string;
  maxSizeMb: number;
  onFile: (file: File) => void;
  title: string;
  hint?: string;
  file?: File | null;
  disabled?: boolean;
  error?: string | null;
  onError?: (message: string) => void;
  onClear?: () => void;
  className?: string;
};

function matchesAccept(file: File, accept: string) {
  return accept
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .some((token) => {
      if (token.startsWith('.')) {
        return file.name.toLowerCase().endsWith(token.toLowerCase());
      }
      if (token.endsWith('/*')) {
        return file.type.startsWith(token.slice(0, -1));
      }
      return file.type === token;
    });
}

/**
 * Zona unggah yang mendukung klik, keyboard, dan drag-and-drop.
 * Validasi tipe/ukuran dilakukan di sini supaya semua pemakaian konsisten.
 */
export function FileDropZone({
  accept,
  maxSizeMb,
  onFile,
  title,
  hint,
  file,
  disabled = false,
  error,
  onError,
  onClear,
  className,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const reject = (message: string) => {
    setValidationError(message);
    onError?.(message);
  };

  const acceptFile = (nextFile: File | undefined) => {
    if (!nextFile || disabled) return;

    if (!matchesAccept(nextFile, accept)) {
      reject(`Format file tidak didukung. Gunakan ${accept}.`);
      return;
    }

    if (nextFile.size > maxSizeMb * 1024 * 1024) {
      reject(`Ukuran file maksimal ${maxSizeMb}MB.`);
      return;
    }

    setValidationError(null);
    onError?.('');
    onFile(nextFile);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div className={className}>
      <div
        role='button'
        tabIndex={disabled ? -1 : 0}
        aria-label={title}
        aria-disabled={disabled || undefined}
        data-dragging={isDragging || undefined}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) event.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-[border-color,background-color,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          isDragging
            ? 'scale-[1.01] border-primary bg-primary/5'
            : 'border-gray-300 bg-gray-50 hover:border-primary/60 hover:bg-primary/[0.03]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input
          ref={inputRef}
          type='file'
          accept={accept}
          disabled={disabled}
          className='hidden'
          onChange={(event) => {
            acceptFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <Upload
          className={cn(
            'h-8 w-8 text-gray-400 transition-transform duration-200',
            isDragging && '-translate-y-1 text-primary',
          )}
        />
        <div>
          <p className='text-sm font-medium text-gray-700'>
            {isDragging ? 'Lepaskan file di sini' : title}
          </p>
          {hint && <p className='mt-1 text-xs text-gray-500'>{hint}</p>}
        </div>
      </div>

      {file && (
        <div className='mt-2 flex animate-in items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 fade-in zoom-in-95 duration-200 ease-spring'>
          <FileText className='h-4 w-4 shrink-0' />
          <span className='min-w-0 flex-1 truncate'>{file.name}</span>
          <span className='shrink-0 text-xs text-green-600'>
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
          {onClear && (
            <button
              type='button'
              aria-label='Hapus file'
              onClick={(event) => {
                event.stopPropagation();
                onClear();
                setValidationError(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className='rounded p-1 text-green-700 transition-colors hover:bg-green-100'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>
      )}

      {(error || validationError) && (
        <p className='mt-2 text-sm text-red-600'>{error || validationError}</p>
      )}
    </div>
  );
}
