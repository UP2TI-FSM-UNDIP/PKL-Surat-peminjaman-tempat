import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BookingCalendar } from '@/features/bookings';
import { useQuery } from '@tanstack/react-query';
import { documentService } from '@/services/document.service';
import { FileText, CheckCircle, Clock, AlertCircle, CalendarCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button/button';

export const Route = createFileRoute('/peminjam/')({
  component: RouteComponent,
});

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgb(0_0_0/0.04)] p-5 flex flex-col gap-4 ${onClick ? 'cursor-pointer transition-shadow hover:shadow-[0_4px_16px_rgb(0_0_0/0.06)]' : ''
        }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <div className={`flex size-8 items-center justify-center rounded-full ${color}`}>{icon}</div>
      </div>
      <div>
        <div className="text-[28px] font-semibold leading-none tracking-tight text-foreground">{value}</div>
        <div className="mt-2 text-xs text-muted-foreground">
          {sub}
        </div>
      </div>
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
  const total = docs.length;
  const approved = docs.filter((d) => d.status === 'APPROVED').length;
  const inProgress = docs.filter((d) => d.status === 'IN_PROGRESS').length;
  const needsAction = docs.filter(
    (d) => d.status === 'DRAFT' || d.status === 'REVISION',
  ).length;

  const goToPinjam = (status: string) =>
    navigate({ to: '/peminjam/pinjam', search: { status } });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selamat datang! Berikut ringkasan pengajuan Anda.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate({ to: '/peminjam/pinjam/baru', search: { jenis: 'pinjam' } })}
          >
            <Send className="w-4 h-4" />
            Ajukan Peminjaman
          </Button>
          <Button
            className="gap-2"
            onClick={() => navigate({ to: '/peminjam/pinjam/baru', search: { jenis: 'reservasi' } })}
          >
            <CalendarCheck className="w-4 h-4" />
            Reservasi
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pengajuan"
          value={isLoading ? '—' : total}
          sub="Semua pengajuan Anda"
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
          onClick={() => goToPinjam('ALL')}
        />
        <StatCard
          label="Disetujui"
          value={isLoading ? '—' : approved}
          sub="Selesai diproses"
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          color="bg-green-50"
          onClick={() => goToPinjam('APPROVED')}
        />
        <StatCard
          label="Sedang Diproses"
          value={isLoading ? '—' : inProgress}
          sub="Menunggu persetujuan"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          color="bg-amber-50"
          onClick={() => goToPinjam('IN_PROGRESS')}
        />
        <StatCard
          label="Perlu Tindakan"
          value={isLoading ? '—' : needsAction}
          sub="Draft atau perlu revisi"
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          color="bg-red-50"
          onClick={() => goToPinjam('DRAFT')}
        />
      </div>

      {/* Kalender */}
      <BookingCalendar />
    </div>
  );
}

export default RouteComponent;
