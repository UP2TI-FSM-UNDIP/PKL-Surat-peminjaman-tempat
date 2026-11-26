import { Check, CircleDot, Clock3, FilePlus2, RotateCcw, Send, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Document, DocumentLog } from '@/types/document';

type Tone = { dot: string; ring: string; label: string; icon: ReactNode };

const ACTIONS: Record<string, Tone> = {
  CREATED: { dot: 'bg-[#8e8e93]', ring: 'ring-[#8e8e93]/15', label: 'Reservasi dibuat', icon: <FilePlus2 className='size-3.5' /> },
  UPDATED: { dot: 'bg-[#8e8e93]', ring: 'ring-[#8e8e93]/15', label: 'Diperbarui', icon: <CircleDot className='size-3.5' /> },
  SUBMITTED: { dot: 'bg-primary', ring: 'ring-primary/15', label: 'Diajukan', icon: <Send className='size-3.5' /> },
  APPROVED: { dot: 'bg-[#34c759]', ring: 'ring-[#34c759]/15', label: 'Disetujui', icon: <Check className='size-3.5' /> },
  REJECTED: { dot: 'bg-[#ff3b30]', ring: 'ring-[#ff3b30]/15', label: 'Ditolak', icon: <X className='size-3.5' /> },
  REVISION: { dot: 'bg-[#ff9f0a]', ring: 'ring-[#ff9f0a]/15', label: 'Diminta revisi', icon: <RotateCcw className='size-3.5' /> },
  RETURNED: { dot: 'bg-[#ff9f0a]', ring: 'ring-[#ff9f0a]/15', label: 'Dikembalikan', icon: <RotateCcw className='size-3.5' /> },
  EXPIRED: { dot: 'bg-[#ff9f0a]', ring: 'ring-[#ff9f0a]/15', label: 'Kedaluwarsa', icon: <Clock3 className='size-3.5' /> },
  CANCELLED: { dot: 'bg-[#8e8e93]', ring: 'ring-[#8e8e93]/15', label: 'Dibatalkan', icon: <X className='size-3.5' /> },
};

/** Catatan otomatis dari sistem yang sama dengan label; tidak perlu ditampilkan ulang. */
const AUTO_NOTES = new Set(['reservasi dibuat', 'dokumen diajukan']);

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·');
}

/**
 * Timeline vertikal riwayat dokumen: entri log yang sudah terjadi, lalu tahap
 * persetujuan yang sedang menunggu dan yang belum dimulai (dari workflow).
 */
export function DocumentTimeline({ document }: { document: Document }) {
  const logs: DocumentLog[] = [...(document.logs ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const steps = [...(document.workflow?.steps ?? [])].sort((a, b) => a.step_order - b.step_order);
  const inProgress = document.status === 'IN_PROGRESS';
  const pendingSteps = inProgress ? steps.filter((step) => step.step_order >= document.current_step_order) : [];

  type Item =
    | { kind: 'log'; log: DocumentLog }
    | { kind: 'step'; name: string; current: boolean; holder?: string };
  const items: Item[] = [
    ...logs.map((log) => ({ kind: 'log' as const, log })),
    ...pendingSteps.map((step) => ({
      kind: 'step' as const,
      name: step.step_name,
      current: step.step_order === document.current_step_order,
      holder: step.step_order === document.current_step_order ? document.current_holder?.name : undefined,
    })),
  ];

  if (items.length === 0) return <p className='text-[13px] text-muted-foreground'>Belum ada riwayat.</p>;

  return (
    <ol className='relative'>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        if (item.kind === 'log') {
          const tone = ACTIONS[item.log.action] ?? ACTIONS.UPDATED;
          const who = item.log.user?.name;
          const role = item.log.user?.role?.name;
          return (
            <li key={`log-${item.log.id}`} className='relative flex gap-3 pb-5 last:pb-0'>
              {!last && <span aria-hidden='true' className='absolute top-7 bottom-0 left-[13px] w-px bg-border' />}
              <span className={cn('relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-white ring-4', tone.dot, tone.ring)}>
                {tone.icon}
              </span>
              <div className='min-w-0 flex-1 pt-0.5'>
                <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
                  <p className='text-[14px] font-semibold text-foreground'>{tone.label}</p>
                  <time className='text-xs tabular-nums text-muted-foreground'>{formatWhen(item.log.created_at)}</time>
                </div>
                {(who || role) && (
                  <p className='text-[13px] text-muted-foreground'>
                    {who}{role && who ? ' · ' : ''}{role}
                  </p>
                )}
                {item.log.note && !AUTO_NOTES.has(item.log.note.trim().toLowerCase()) && (
                  <p className='mt-1.5 rounded-xl bg-muted/70 px-3 py-2 text-[13px] leading-5 text-foreground/90'>{item.log.note}</p>
                )}
              </div>
            </li>
          );
        }
        return (
          <li key={`step-${item.name}-${index}`} className='relative flex gap-3 pb-5 last:pb-0'>
            {!last && <span aria-hidden='true' className='absolute top-7 bottom-0 left-[13px] w-px border-l border-dashed border-border' />}
            <span
              className={cn(
                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full',
                item.current ? 'bg-white text-primary ring-2 ring-primary' : 'bg-white text-[#c7c7cc] ring-1 ring-border',
              )}
            >
              {item.current && <span className='absolute inset-0 animate-ping rounded-full bg-primary/20' />}
              <Clock3 className='size-3.5' />
            </span>
            <div className='min-w-0 flex-1 pt-0.5'>
              <p className={cn('text-[14px] font-semibold', item.current ? 'text-foreground' : 'text-muted-foreground')}>{item.name}</p>
              <p className='text-[13px] text-muted-foreground'>
                {item.current ? `Menunggu${item.holder ? ` ${item.holder}` : ''}` : 'Belum dimulai'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
