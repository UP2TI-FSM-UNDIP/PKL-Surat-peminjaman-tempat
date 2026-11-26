import { formatDateShort } from '@/lib/date';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DocumentStatusBadge } from '@/components/DocumentStatusBadge';
import { documentService } from '@/services/document.service';
import type { ApprovalDetailRoute } from './routes';

export function ApprovalQueuePage({ detailRoute }: { detailRoute: ApprovalDetailRoute }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['documents', 'pending', page],
    queryFn: () => documentService.getDocuments({ page_pending: page }),
  });
  const documents = query.data?.pending_documents ?? [];
  const pagination = query.data?.pending_documents_pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-[28px] font-semibold tracking-tight">Antrean persetujuan</h1>
        <Badge variant="secondary" className="rounded-full">{pagination?.total ?? 0}</Badge>
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <Table>
        <TableHeader><TableRow><TableHead>Pemohon</TableHead><TableHead>Ruang</TableHead><TableHead>Kegiatan</TableHead><TableHead>Tanggal</TableHead><TableHead>Batas proposal</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{document.creator?.name ?? document.creator_id}</TableCell>
              <TableCell><RoomCodes slots={document.content?.slots} /></TableCell>
              <TableCell>{document.content?.event_name ?? document.title}</TableCell>
              <TableCell>{formatDateShort(document.content?.slots?.[0]?.booking_date)}{(document.content?.slots?.length ?? 0) > 1 && <span className="text-muted-foreground"> · {document.content?.slots?.length} slot</span>}</TableCell>
              <TableCell>{formatDateShort(document.reservation_deadline)}</TableCell>
              <TableCell><DocumentStatusBadge doc={document} /></TableCell>
              <TableCell>
                <Link to={detailRoute} params={{ documentId: String(document.id) }}>
                  <Button size="sm" variant="outline">Tinjau</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      {documents.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada pengajuan menunggu.</p>}
      {pagination && pagination.last_page > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button>
          <Button variant="outline" disabled={page >= pagination.last_page} onClick={() => setPage((value) => value + 1)}>Berikutnya</Button>
        </div>
      )}
    </div>
  );
}

export function RoomCodes({ slots }: { slots?: Array<{ room_id: number; room_code?: string | null }> }) {
  const codes = [...new Set((slots ?? []).map((slot) => slot.room_code ?? `#${slot.room_id}`))];
  if (codes.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {codes.slice(0, 2).map((code) => (
        <span key={code} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{code}</span>
      ))}
      {codes.length > 2 && <span className="px-1 text-xs text-muted-foreground">+{codes.length - 2}</span>}
    </div>
  );
}
