/**
 * Tanggal booking deterministik untuk suite e2e.
 *
 * Basis adalah Senin terdekat minimal 7 hari dari hari ini. Retry mendapat
 * rentang +10 hari agar percobaan ulang tidak menabrak booking yang sudah
 * dibuat pada percobaan pertama.
 */
export function bookingDates(retry = 0) {
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + 7 + retry * 10);

  while (base.getDay() !== 1) {
    base.setDate(base.getDate() + 1);
  }

  const add = (days: number) => {
    const date = new Date(base);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    a: add(0),
    b: add(1),
    c: add(2),
    d: add(3),
    e: add(5),
    f: add(7),
  };
}
