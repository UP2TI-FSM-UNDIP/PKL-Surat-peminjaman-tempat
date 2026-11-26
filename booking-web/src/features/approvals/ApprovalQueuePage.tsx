import { formatDateShort } from '@/lib/date';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableCard } from '@/components/common/TableCard';
import { RoomCodes } from '@/components/common/RoomCodes';
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
      <PageHeader title="Antrean persetujuan" count={pagination?.total ?? 0} />
      <TableCard>
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
      </TableCard>
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
