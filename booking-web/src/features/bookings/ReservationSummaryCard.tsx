import { formatTimeRange, formatDateShort } from '@/lib/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Document } from '@/types/document';
import type { ReservationContent, ReservationSummary } from '@/types/reservation';

export function ReservationSummaryCard({ document, summary }: {
  document: Document<ReservationContent>;
  summary?: ReservationSummary;
}) {
  const slots = summary?.slots ?? document.content?.slots ?? [];
  const equipment = summary?.equipment_items ?? document.content?.equipment_items ?? [];
  return (
    <Card>
      <CardHeader><CardTitle>Ringkasan Reservasi</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 md:grid-cols-2">
          <p><span className="text-muted-foreground">Tujuan:</span> {document.content?.purpose ?? document.title}</p>
          <p><span className="text-muted-foreground">Ketua:</span> {document.content?.ketua_pelaksana_nama ?? '-'}</p>
          <p><span className="text-muted-foreground">Peserta:</span> {document.content?.expected_participants ?? '-'}</p>
          <p><span className="text-muted-foreground">Buka Sekat:</span> {document.content?.buka_sekat ? 'Ya' : 'Tidak'}</p>
          <p><span className="text-muted-foreground">Batas proposal:</span> {formatDateShort(summary?.reservation_deadline ?? document.reservation_deadline)}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Ruang</TableHead><TableHead>Tanggal</TableHead><TableHead>Jam</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((slot, index) => (
              <TableRow key={`${slot.room_id}-${slot.booking_date}-${index}`}>
                <TableCell>{slot.room_code ?? slot.room_name ?? slot.room_id}</TableCell>
                <TableCell>{formatDateShort(slot.booking_date)}</TableCell>
                <TableCell>{formatTimeRange(slot.start_time, slot.end_time)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div>
          <p className="font-medium">Kebutuhan alat</p>
          {equipment.length === 0 ? <p className="text-muted-foreground">Tidak ada</p> : (
            <ul className="list-disc pl-5">
              {equipment.map((item) => <li key={item.nama}>{item.nama} × {item.jumlah}</li>)}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
