import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { documentService } from '@/services/document.service';
import type { ApprovalDetailRoute } from './routes';

export function ApprovalHistoryPage({ detailRoute }: { detailRoute: ApprovalDetailRoute }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['documents', 'processed', page],
    queryFn: () => documentService.getDocuments({ page_processed: page }),
  });
  const documents = query.data?.processed_documents ?? [];
  const pagination = query.data?.processed_documents_pagination;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Riwayat Persetujuan</h1>
      <Table>
        <TableHeader><TableRow><TableHead>Pemohon</TableHead><TableHead>Kegiatan</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell>{document.creator?.name ?? document.creator_id}</TableCell>
              <TableCell>{document.content?.event_name ?? document.title}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {[...(document.logs ?? [])].reverse().find((log) => ['APPROVED', 'REJECTED', 'RETURNED'].includes(log.action))?.action ?? document.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Link to={detailRoute} params={{ documentId: String(document.id) }}>
                  <Button size="sm" variant="outline">Lihat</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && pagination.last_page > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button>
          <Button variant="outline" disabled={page >= pagination.last_page} onClick={() => setPage((value) => value + 1)}>Berikutnya</Button>
        </div>
      )}
    </div>
  );
}
