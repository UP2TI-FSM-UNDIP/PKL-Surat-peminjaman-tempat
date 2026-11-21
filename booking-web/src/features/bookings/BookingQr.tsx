import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';

/** Ubah blob QR menjadi data URL agar aman disimpan di cache React Query. */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function BookingQr({ bookingId }: { bookingId: number }) {
  const { data: url } = useQuery({
    queryKey: ['booking-qrcode', bookingId],
    queryFn: async () => {
      const { blob, objectUrl } = await bookingService.fetchQr(bookingId);
      URL.revokeObjectURL(objectUrl);
      return blobToDataUrl(blob);
    },
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  if (!url) return null;
  return <img src={url} alt={`QR bukti peminjaman ${bookingId}`} className="h-40 w-40" />;
}
