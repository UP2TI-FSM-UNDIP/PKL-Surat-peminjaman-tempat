/**
 * Aturan jadwal peminjaman ruang (harus sama dengan backend:
 * RoomBookingService::validateScheduleRules dan config/booking.php).
 */
export const BOOKING_RULES = {
  /** Hanya hari Sabtu (0 = Minggu ... 6 = Sabtu) */
  allowedWeekday: 6,
  /** Minimal hari kalender sebelum hari-H */
  minDaysAhead: 8,
  openTime: '09:00',
  closeTime: '17:00',
} as const;

/**
 * Cek apakah tanggal (YYYY-MM-DD) boleh dipinjam.
 * Mengembalikan null jika boleh, atau alasan jika tidak.
 */
export function getBookingDateIssue(dateStr: string): string | null {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak valid.';

  if (date.getDay() !== BOOKING_RULES.allowedWeekday) {
    return 'Peminjaman ruang hanya bisa untuk hari Sabtu.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAhead = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (daysAhead < BOOKING_RULES.minDaysAhead) {
    return `Peminjaman harus diajukan minimal ${BOOKING_RULES.minDaysAhead} hari sebelum hari-H.`;
  }

  return null;
}
