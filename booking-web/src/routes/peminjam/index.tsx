import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BookingCalendar } from '@/features/bookings';
import { useQuery } from '@tanstack/react-query';
import { documentService } from '@/services/document.service';
import { authService } from '@/services/auth.service';
import { isPrimaryBorrower } from '@/lib/borrowerRoles';
import { APPROVAL_BASE } from '@/lib/roleRoutes';
import type { RoleSlug } from '@/types/auth';
import { ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/peminjam/')({
  component: RouteComponent,
});

type Stat = { label: string; value: number | string; dot: string; hint?: string; alert?: boolean; go: () => void };

/** Ringkasan pengajuan dalam satu kartu tipis, dipisah garis — tidak menutupi kalender. */
function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] lg:grid-cols-4">
      {stats.map((stat, index) => (
        <button
          key={stat.label}
          type="button"
          onClick={stat.go}
          className={`group flex items-center justify-between gap-2 border-black/[0.06] px-3.5 py-3 text-left transition-colors sm:gap-3 sm:px-5 sm:py-3.5 ${
            stat.alert ? 'bg-[#fff4f3] hover:bg-[#ffeceb]' : 'hover:bg-[#fafafb]'
          } ${index % 2 === 1 ? 'border-l' : ''} ${index >= 2 ? 'border-t lg:border-t-0' : ''} ${index === 2 ? 'lg:border-l' : ''}`}
        >
          <span className="min-w-0">
            <span className={`flex items-center gap-1.5 text-xs sm:gap-2 sm:text-[13px] ${stat.alert ? 'font-semibold text-[#d70015]' : 'text-muted-foreground'}`}>
              <span className={`size-2 shrink-0 rounded-full ${stat.dot} ${stat.alert ? 'animate-pulse' : ''}`} />
              <span className="truncate">{stat.label}</span>
            </span>
            {stat.hint && (
              <span className={`mt-0.5 flex items-center gap-0.5 truncate text-[11px] ${stat.alert ? 'text-[#d70015]/80' : 'text-muted-foreground/80'}`}>
                {stat.hint} <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </span>
          <span className={`text-xl font-semibold tabular-nums tracking-tight ${stat.alert ? 'text-[#d70015]' : 'text-foreground'}`}>{stat.value}</span>
        </button>
      ))}
    </div>
  );
}

function RouteComponent() {
  const navigate = useNavigate();
  const slug = authService.getRoleSlug() as RoleSlug;
  const primary = isPrimaryBorrower(slug);
  const approvalBase = APPROVAL_BASE[slug];

  const { data: queryResult, isLoading } = useQuery({
    queryKey: ['documents', 'mine', 1],
    queryFn: () => documentService.getDocuments({ page_my: 1, per_page: 100, mine: 1 }),
  });

  const docs = queryResult?.my_documents ?? [];
  const count = (predicate: (status: string) => boolean) =>
    isLoading ? '—' : docs.filter((d) => predicate(d.status)).length;
  const toList = (status: string) => () => navigate({ to: '/peminjam/pinjam', search: { status } });

  let stats: Stat[];
  if (approvalBase) {
    const pending = queryResult?.pending_documents_pagination.total ?? 0;
    const processed = queryResult?.processed_documents_pagination.total ?? 0;
    stats = [
      {
        label: 'Perlu tindakan',
        value: isLoading ? '—' : pending,
        dot: pending > 0 ? 'bg-[#ff3b30]' : 'bg-[#34c759]',
        hint: pending > 0 ? 'Buka antrean' : 'Antrean kosong',
        alert: pending > 0,
        go: () => navigate({ to: approvalBase }),
      },
      { label: 'Sudah diproses', value: isLoading ? '—' : processed, dot: 'bg-[#0071e3]', hint: 'Lihat riwayat', go: () => navigate({ to: `${approvalBase}/riwayat` }) },
      { label: 'Pengajuan saya', value: isLoading ? '—' : docs.length, dot: 'bg-[#af52de]', hint: 'Lihat daftar', go: toList('') },
      { label: 'Pengajuan diproses', value: count((s) => s === 'IN_PROGRESS'), dot: 'bg-[#ff9f0a]', hint: 'Lihat daftar', go: toList('IN_PROGRESS') },
    ];
  } else {
    const needs = count((s) => s === 'DRAFT' || s === 'REVISION');
    stats = [
      { label: 'Total pengajuan', value: isLoading ? '—' : docs.length, dot: 'bg-[#0071e3]', go: toList('') },
      { label: 'Disetujui', value: count((s) => s === 'APPROVED'), dot: 'bg-[#34c759]', go: toList('APPROVED') },
      { label: 'Sedang diproses', value: count((s) => s === 'IN_PROGRESS'), dot: 'bg-[#ff9f0a]', go: toList('IN_PROGRESS') },
      {
        label: 'Perlu tindakan',
        value: needs,
        dot: 'bg-[#ff3b30]',
        hint: typeof needs === 'number' && needs > 0 ? 'Lengkapi proposal' : undefined,
        alert: typeof needs === 'number' && needs > 0,
        go: toList('DRAFT,REVISION'),
      },
    ];
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{primary ? 'Dashboard' : 'Beranda'}</h1>
        <p className="text-[13px] text-muted-foreground">
          {approvalBase ? 'Ringkasan persetujuan dan jadwal ruang. Klik kartu untuk membuka daftarnya.' : 'Ringkasan pengajuan dan jadwal ruang. Klik tanggal di kalender untuk mengajukan.'}
        </p>
      </div>

      <StatStrip stats={stats} />

      <BookingCalendar />
    </div>
  );
}

export default RouteComponent;
