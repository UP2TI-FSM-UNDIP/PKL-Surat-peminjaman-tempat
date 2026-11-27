import type { FormEvent, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import { cn } from '@/lib/utils';

const SIZE = {
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-2xl',
} as const;

/**
 * Modal standar untuk form CRUD: judul & tombol selalu terlihat (sticky),
 * hanya isi yang bergulir. Isi memakai grid 2 kolom agar tidak banyak scroll.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel = 'Simpan',
  isSubmitting = false,
  error,
  size = 'lg',
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Bila diisi, isi dibungkus <form> dan footer berisi Batal + submit. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: ReactNode;
  size?: keyof typeof SIZE;
  /** Footer kustom (untuk modal detail). */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const body = (
    <>
      <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6'>
        {children}
        {error && (
          <p className='mt-4 rounded-xl bg-[#fdeeee] px-3 py-2 text-[13px] font-medium text-destructive'>{error}</p>
        )}
      </div>
      <div className='flex shrink-0 justify-end gap-2 border-t border-black/[0.06] bg-[#fafafb] px-5 py-3 sm:px-6'>
        {footer ?? (
          <>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan…' : submitLabel}
            </Button>
          </>
        )}
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0', SIZE[size])}>
        <div className='shrink-0 border-b border-black/[0.06] px-5 pb-3 pt-5 pr-14 sm:px-6'>
          <DialogTitle className='text-[17px]'>{title}</DialogTitle>
          {description ? (
            <DialogDescription className='mt-1 text-[13px]'>{description}</DialogDescription>
          ) : (
            <DialogDescription className='sr-only'>{typeof title === 'string' ? title : 'Form'}</DialogDescription>
          )}
        </div>
        {onSubmit ? (
          <form onSubmit={onSubmit} className='flex min-h-0 flex-1 flex-col'>
            {body}
          </form>
        ) : (
          body
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Kelompok field berjudul dengan grid 2 kolom. */
export function FormSection({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-3 border-black/[0.06] [&+&]:mt-4 [&+&]:border-t [&+&]:pt-4', className)}>
      {title && <h3 className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>{title}</h3>}
      <div className='grid gap-x-4 gap-y-3 sm:grid-cols-2'>{children}</div>
    </section>
  );
}

/** Satu field: label, kontrol, dan hint singkat. `wide` = selebar 2 kolom. */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  wide,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  wide?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('grid min-w-0 content-start gap-1.5', wide && 'sm:col-span-2', className)}>
      <label htmlFor={htmlFor} className='text-[13px] font-medium text-foreground'>
        {label}
        {required && <span className='ml-0.5 text-destructive'>*</span>}
      </label>
      {children}
      {hint && <p className='text-xs leading-snug text-muted-foreground'>{hint}</p>}
    </div>
  );
}

/** Daftar detail label–nilai 2 kolom untuk modal "Detail". */
export function DetailGrid({ items }: { items: Array<[ReactNode, ReactNode, boolean?]> }) {
  return (
    <dl className='grid grid-cols-2 gap-x-4 gap-y-3'>
      {items.map(([label, value, wide], index) => (
        <div key={index} className={cn('min-w-0', wide && 'col-span-2')}>
          <dt className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>{label}</dt>
          <dd className='mt-0.5 break-words text-[14px] font-medium text-foreground'>{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Kelas textarea yang seragam dengan Input. */
export const textareaClass =
  'block w-full rounded-[10px] border border-input bg-white px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';
