import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ReservationWizardForm } from '@/features/bookings/ReservationWizardForm';

export const Route = createFileRoute('/peminjam/pinjam/baru')({
  component: NewReservationPage,
});

function NewReservationPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reservasi Ruang</h1>
        <p className="text-sm text-muted-foreground">Pilih slot terlebih dahulu. Slot akan ditahan setelah reservasi dibuat.</p>
      </div>
      <ReservationWizardForm
        intent="reservation"
        onSuccess={(document) => navigate({ to: '/peminjam/pinjam/$documentId/proposal', params: { documentId: String(document.id) } })}
      />
    </div>
  );
}
