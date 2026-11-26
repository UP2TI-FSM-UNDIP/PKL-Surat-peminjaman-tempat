import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ReservationWizardForm } from '@/features/bookings/ReservationWizardForm';

export const Route = createFileRoute('/admin/peminjaman/baru')({ component: AdminManualBookingPage });

function AdminManualBookingPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Buat Manual Booking</h1>
        <p className="text-sm text-muted-foreground">
          Booking admin langsung disetujui dan tidak mewajibkan proposal PDF.
        </p>
      </div>
      <ReservationWizardForm
        intent="submit"
        submitLabel="Buat Manual Booking"
        onSuccess={() => navigate({ to: '/admin/peminjaman' })}
      />
    </div>
  );
}
