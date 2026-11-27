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
import { SlotList } from '@/components/common/SlotList';
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

function DecisionBadge({ document }: { document: Document }) {
  const decision = lastDecision(document);
  const meta = decision ? DECISION_META[decision.action] : undefined;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta?.className ?? 'bg-gray-100 text-gray-800'}`}>
      {meta?.label ?? document.status}
    </span>
  );
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
              <DecisionBadge document={document} />
            </div>
            <SlotList slots={document.content?.slots} />
            
          </Link>
        ))}
      </div>
      <TableCard className="hidden md:block">
      <Table>
        <TableHeader><TableRow><TableHead>Pengajuan</TableHead><TableHead>Jadwal (tanggal · jam · ruang)</TableHead><TableHead>Diputuskan</TableHead><TableHead>Keputusan</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {documents.map((document) => {
            const decision = lastDecision(document);
            return (
              <TableRow key={document.id}>
                <TableCell className="align-top whitespace-normal">
                  <p className="font-medium">{document.content?.event_name || document.content?.purpose || document.title}</p>
                  <p className="text-xs text-muted-foreground">{document.creator?.name ?? '—'}</p>
                </TableCell>
                <TableCell className="align-top"><SlotList slots={document.content?.slots} /></TableCell>
                <TableCell className="align-top">{decision ? formatDateShort(decision.created_at) : '—'}</TableCell>
                <TableCell className="align-top">
                  <DecisionBadge document={document} />
                </TableCell>
                <TableCell className="align-top text-right">
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
