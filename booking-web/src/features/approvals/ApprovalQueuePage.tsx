import { documentKey } from '@/types/document';
import { formatDateShort } from '@/lib/date';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableCard } from '@/components/common/TableCard';
import { SlotList } from '@/components/common/SlotList';
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
      <div className="space-y-2 md:hidden">
        {documents.map((document) => (
          <Link
            key={document.id}
            to={detailRoute}
            params={{ documentId: documentKey(document) }}
            className="block rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] active:bg-muted/50"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-snug">{document.content?.event_name || document.content?.purpose || document.title}</p>
                <p className="text-xs text-muted-foreground">{document.creator?.name ?? '—'}</p>
              </div>
              <DocumentStatusBadge doc={document} />
            </div>
            <SlotList slots={document.content?.slots} />
            <p className="mt-2 text-xs text-muted-foreground">Batas proposal {formatDateShort(document.reservation_deadline)}</p>
          </Link>
        ))}
      </div>
      <TableCard className="hidden md:block">
      <Table>
        <TableHeader><TableRow><TableHead>Pengajuan</TableHead><TableHead>Jadwal (tanggal · jam · ruang)</TableHead><TableHead>Batas proposal</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="align-top whitespace-normal">
                <p className="font-medium">{document.content?.event_name || document.content?.purpose || document.title}</p>
                <p className="text-xs text-muted-foreground">{document.creator?.name ?? '—'}</p>
              </TableCell>
              <TableCell className="align-top"><SlotList slots={document.content?.slots} /></TableCell>
              <TableCell className="align-top">{formatDateShort(document.reservation_deadline)}</TableCell>
              <TableCell className="align-top"><DocumentStatusBadge doc={document} /></TableCell>
              <TableCell className="align-top text-right">
                <Link to={detailRoute} params={{ documentId: documentKey(document) }}>
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
