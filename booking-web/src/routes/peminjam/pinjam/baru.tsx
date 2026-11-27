import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ReservationWizardForm } from '@/features/bookings/ReservationWizardForm';

export type JenisPengajuan = 'reservasi' | 'pinjam';

interface NewReservationSearch {
  tanggal?: string;
  jenis?: JenisPengajuan;
}

export const Route = createFileRoute('/peminjam/pinjam/baru')({
  validateSearch: (search: Record<string, unknown>): NewReservationSearch => ({
    tanggal: typeof search.tanggal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.tanggal) ? search.tanggal : undefined,
    jenis: search.jenis === 'pinjam' ? 'pinjam' : search.jenis === 'reservasi' ? 'reservasi' : undefined,
  }),
  component: NewReservationPage,
});

function NewReservationPage() {
  const navigate = useNavigate();
  const { tanggal, jenis } = Route.useSearch();
  const isPinjam = jenis === 'pinjam';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-primary">{isPinjam ? 'Ajukan Pinjam' : 'Reservasi'}</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-[28px]">{isPinjam ? 'Ajukan peminjaman ruang' : 'Reservasi ruang'}</h1>
        <p className="max-w-2xl text-[15px] text-muted-foreground">
          {isPinjam
            ? 'Untuk yang proposalnya sudah lengkap. Setelah slot dibuat, lengkapi proposal lalu ajukan saat itu juga. Peminjaman hari ini hanya bisa lewat alur ini.'
            : 'Pilih slot terlebih dahulu. Slot akan ditahan setelah reservasi dibuat.'}
        </p>
      </div>
      <ReservationWizardForm
        key={`${jenis ?? 'reservasi'}-${tanggal ?? ''}`}
        intent={isPinjam ? 'submit' : 'reservation'}
        submitLabel={isPinjam ? 'Lanjut ke Proposal' : 'Simpan Reservasi'}
        initialDate={tanggal}
        onSuccess={(document) => navigate({ to: '/peminjam/pinjam/$documentId/proposal', params: { documentId: String(document.id) } })}
      />
    </div>
  );
}
