import { Button } from '@/components/ui/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { fileService } from '@/services/file.service';
import { getErrorMessage } from '@/lib/errors';
import type { Document } from '@/types/document';
import type { ReservationContent, ReservationSummary } from '@/types/reservation';

export function ApprovalSummaryCard({ document, summary }: {
  document: Document<ReservationContent>;
  summary: ReservationSummary;
}) {
  const openProposal = async () => {
    const tab = window.open('', '_blank');
    if (!tab) {
      toast.error('Popup diblokir. Izinkan popup untuk melihat proposal.');
      return;
    }
    tab.opener = null;
    try {
      const { objectUrl } = await fileService.fetchBlobUrl(`/documents/${document.id}/file/proposal`);
      tab.location.href = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      tab.close();
      toast.error(getErrorMessage(error, 'Proposal tidak dapat dibuka.'));
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Ringkasan Pengajuan</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 md:grid-cols-2">
          <p><span className="text-muted-foreground">Pemohon:</span> {document.creator?.name ?? document.creator_id}</p>
          <p><span className="text-muted-foreground">Unit:</span> {document.unit?.name ?? '-'}</p>
          <p><span className="text-muted-foreground">Kegiatan:</span> {document.content?.event_name ?? document.title}</p>
          <p><span className="text-muted-foreground">Tujuan:</span> {document.content?.purpose ?? '-'}</p>
          <p><span className="text-muted-foreground">Deadline:</span> {summary.reservation_deadline ?? '-'}</p>
          <p><span className="text-muted-foreground">Buka Sekat:</span> {document.content?.buka_sekat ? 'Ya' : 'Tidak'}</p>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Ruang</TableHead><TableHead>Tanggal</TableHead><TableHead>Jam</TableHead></TableRow></TableHeader>
          <TableBody>
            {summary.slots.map((slot, index) => (
              <TableRow key={`${slot.room_id}-${slot.booking_date}-${index}`}>
                <TableCell>{slot.room_code ?? slot.room_name ?? slot.room_id}</TableCell>
                <TableCell>{slot.booking_date}</TableCell>
                <TableCell>{slot.start_time}–{slot.end_time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div>
          <p className="font-medium">Kebutuhan alat</p>
          {summary.equipment_items.length === 0 ? <p className="text-muted-foreground">Tidak ada</p> : (
            <ul className="list-disc pl-5">{summary.equipment_items.map((item) => <li key={item.nama}>{item.nama} × {item.jumlah}</li>)}</ul>
          )}
        </div>
        <Button variant="outline" onClick={openProposal}>Lihat proposal PDF</Button>
      </CardContent>
    </Card>
  );
}
