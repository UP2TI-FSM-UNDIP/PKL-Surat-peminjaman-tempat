import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

/** Judul halaman seragam: judul, jumlah data/status opsional, deskripsi, dan aksi di kanan. */
export function PageHeader({ title, count, badge, description, actions }: {
  title: ReactNode;
  count?: number;
  badge?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">{title}</h1>
          {count !== undefined && <Badge variant="secondary" className="rounded-full">{count}</Badge>}
          {badge}
        </div>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
