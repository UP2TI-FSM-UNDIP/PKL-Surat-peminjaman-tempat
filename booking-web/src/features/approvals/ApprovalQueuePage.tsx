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
        <h1 className="text-2xl font-semibold">Antrean Persetujuan</h1>
        <Badge variant="secondary">{pagination?.total ?? 0}</Badge>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Pemohon</TableHead><TableHead>Unit</TableHead><TableHead>Kegiatan</TableHead><TableHead>Slot</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell>{document.creator?.name ?? document.creator_id}</TableCell>
              <TableCell>{document.unit?.name ?? '-'}</TableCell>
              <TableCell>{document.content?.event_name ?? document.title}</TableCell>
              <TableCell>{document.content?.slots?.length ?? 0} slot · {document.content?.slots?.[0]?.booking_date ?? '-'}</TableCell>
              <TableCell>{document.reservation_deadline ?? '-'}</TableCell>
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
