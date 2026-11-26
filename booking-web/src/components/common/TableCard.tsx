import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Pembungkus tabel daftar data: kartu putih membulat, sama di semua halaman. */
export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]', className)}>
      {children}
    </div>
  );
}

/** Baris kosong di dalam tabel. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-[13px] text-muted-foreground">{children}</td>
    </tr>
  );
}
