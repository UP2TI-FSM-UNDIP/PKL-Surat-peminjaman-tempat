import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'info' | 'warning' | 'danger' | 'success';

const tones: Record<Tone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: 'bg-[#eef5fe] text-[#1d3b5c]', icon: 'text-primary', Icon: Info },
  warning: { box: 'bg-[#fff6e5] text-[#5c3d00]', icon: 'text-[#c77700]', Icon: AlertTriangle },
  danger: { box: 'bg-[#fdeeee] text-[#6b1212]', icon: 'text-destructive', Icon: XCircle },
  success: { box: 'bg-[#ecf8ef] text-[#174d26]', icon: 'text-[#248a3d]', Icon: CheckCircle2 },
};

/** Pesan ringkas bergaya bersih: latar lembut tanpa garis tepi, ikon kecil, judul opsional. */
export function Callout({ tone = 'info', title, children, className }: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { box, icon, Icon } = tones[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'note'} className={cn('flex gap-3 rounded-xl px-4 py-3 text-[13px] leading-5', box, className)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', icon)} aria-hidden='true' />
      <div className='min-w-0 space-y-0.5'>
        {title && <p className='font-semibold'>{title}</p>}
        {children && <div className='opacity-90'>{children}</div>}
      </div>
    </div>
  );
}
