import { documentKey } from '@/types/document';
import { formatDateShort } from '@/lib/date';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableCard } from '@/components/common/TableCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { documentService } from '@/services/document.service';
import type { Document } from '@/types/document';
import { RoomCodes } from '@/components/common/RoomCodes';
import type { ApprovalDetailRoute } from './routes';

const DECISION_META: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Disetujui', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Ditolak', className: 'bg-red-100 text-red-800' },
  RETURNED: { label: 'Dikembalikan', className: 'bg-orange-100 text-orange-800' },
};

/** Keputusan terakhir (setuju/tolak/kembalikan) yang tercatat pada dokumen. */
function lastDecision(document: Document) {
  return [...(document.logs ?? [])]
    .reverse()
    .find((log) => log.action in DECISION_META);
}

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
      <PageHeader title="Riwayat persetujuan" count={pagination?.total ?? documents.length} />
      <TableCard>
      <Table>
        <TableHeader><TableRow><TableHead>Pemohon</TableHead><TableHead>Ruang</TableHead><TableHead>Kegiatan</TableHead><TableHead>Tanggal</TableHead><TableHead>Diputuskan</TableHead><TableHead>Keputusan</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {documents.map((document) => {
            const decision = lastDecision(document);
            const meta = decision ? DECISION_META[decision.action] : undefined;
            return (
              <TableRow key={document.id}>
                <TableCell className="font-medium">{document.creator?.name ?? document.creator_id}</TableCell>
                <TableCell><RoomCodes slots={document.content?.slots} /></TableCell>
                <TableCell>{document.content?.event_name ?? document.title}</TableCell>
                <TableCell>{formatDateShort(document.content?.slots?.[0]?.booking_date)}{(document.content?.slots?.length ?? 0) > 1 && <span className="text-muted-foreground"> · {document.content?.slots?.length} slot</span>}</TableCell>
                <TableCell>{decision ? formatDateShort(decision.created_at) : '—'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta?.className ?? 'bg-gray-100 text-gray-800'}`}>
                    {meta?.label ?? document.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Link to={detailRoute} params={{ documentId: documentKey(document) }}>
                    <Button size="sm" variant="outline">Lihat</Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </TableCard>
      {documents.length === 0 && !query.isLoading && <p className="text-sm text-muted-foreground">Belum ada riwayat persetujuan.</p>}
      {pagination && pagination.last_page > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button>
          <Button variant="outline" disabled={page >= pagination.last_page} onClick={() => setPage((value) => value + 1)}>Berikutnya</Button>
        </div>
      )}
    </div>
  );
}
