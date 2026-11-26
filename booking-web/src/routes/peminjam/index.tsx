import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BookingCalendar } from '@/features/bookings';
import { useQuery } from '@tanstack/react-query';
import { documentService } from '@/services/document.service';

export const Route = createFileRoute('/peminjam/')({
  component: RouteComponent,
});

type Stat = { label: string; value: number | string; dot: string; status: string };

/** Ringkasan pengajuan dalam satu kartu tipis, dipisah garis — tidak menutupi kalender. */
function StatStrip({ stats, onSelect }: { stats: Stat[]; onSelect: (status: string) => void }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] lg:grid-cols-4">
      {stats.map((stat, index) => (
        <button
          key={stat.label}
          type="button"
          onClick={() => onSelect(stat.status)}
          className={`flex items-center justify-between gap-2 border-black/[0.06] px-3.5 py-3 sm:gap-3 sm:px-5 sm:py-3.5 text-left transition-colors hover:bg-[#fafafb] ${
            index % 2 === 1 ? 'border-l' : ''
          } ${index >= 2 ? 'border-t lg:border-t-0' : ''} ${index === 2 ? 'lg:border-l' : ''}`}
        >
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-[13px]">
            <span className={`size-2 shrink-0 rounded-full ${stat.dot}`} />
            <span className="truncate">{stat.label}</span>
          </span>
          <span className="text-xl font-semibold tabular-nums tracking-tight text-foreground">{stat.value}</span>
        </button>
      ))}
    </div>
  );
}

function RouteComponent() {
  const navigate = useNavigate();

  const { data: queryResult, isLoading } = useQuery({
    queryKey: ['documents', 1],
    queryFn: () => documentService.getDocuments({ page_my: 1, per_page: 100 }),
  });

  const docs = queryResult?.my_documents ?? [];
  const count = (predicate: (status: string) => boolean) =>
    isLoading ? '—' : docs.filter((d) => predicate(d.status)).length;

  const stats: Stat[] = [
    { label: 'Total pengajuan', value: isLoading ? '—' : docs.length, dot: 'bg-[#0071e3]', status: 'ALL' },
    { label: 'Disetujui', value: count((s) => s === 'APPROVED'), dot: 'bg-[#34c759]', status: 'APPROVED' },
    { label: 'Sedang diproses', value: count((s) => s === 'IN_PROGRESS'), dot: 'bg-[#ff9f0a]', status: 'IN_PROGRESS' },
    { label: 'Perlu tindakan', value: count((s) => s === 'DRAFT' || s === 'REVISION'), dot: 'bg-[#ff3b30]', status: 'DRAFT' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-[13px] text-muted-foreground">Ringkasan pengajuan dan jadwal ruang. Klik tanggal di kalender untuk mengajukan.</p>
      </div>

      <StatStrip stats={stats} onSelect={(status) => navigate({ to: '/peminjam/pinjam', search: { status } })} />

      <BookingCalendar />
    </div>
  );
}

export default RouteComponent;
