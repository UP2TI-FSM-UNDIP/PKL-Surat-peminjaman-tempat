import { formatDateShort } from '@/lib/date';
import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { documentService } from '@/services/document.service';
import { DocumentStatusBadge } from '@/components/DocumentStatusBadge';

export const Route = createFileRoute('/peminjam/pinjam/')({
  validateSearch: (search: Record<string, unknown>): { status: string } => {
    const value = typeof search.status === 'string' ? search.status : '';
    return { status: value === 'ALL' ? '' : value };
  },
  component: SubmissionListPage,
});

const filters = [
  ['', 'Semua'], ['DRAFT', 'Draft'], ['REVISION', 'Revisi'], ['IN_PROGRESS', 'Diajukan'], ['APPROVED', 'Disetujui'],
  ['REJECTED', 'Ditolak'], ['EXPIRED', 'Kedaluwarsa'], ['CANCELLED', 'Dibatalkan'],
] as const;

function SubmissionListPage() {
  const { status: initialStatus } = Route.useSearch();
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['documents', 'my', status, page],
    queryFn: () => documentService.getDocuments({ status: status || undefined, page_my: page }),
  });
  const documents = query.data?.my_documents ?? [];
  const pagination = query.data?.my_documents_pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Daftar Pengajuan</h1>
        <Link to="/peminjam/pinjam/baru"><Button>Buat Reservasi</Button></Link>
      </div>
      <SegmentedControl
        ariaLabel='Filter status pengajuan'
        value={status || 'ALL'}
        onChange={(value) => {
          setStatus(value === 'ALL' ? '' : value);
          setPage(1);
        }}
        options={[
          { value: 'ALL', label: 'Semua' },
          ...filters.slice(1).map(([value, label]) => ({ value, label })),
        ]}
      />
      <Table>
        <TableHeader><TableRow><TableHead>Kegiatan</TableHead><TableHead>Slot</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell>{document.content?.event_name ?? document.title}</TableCell>
              <TableCell>{document.content?.slots?.length ?? 0} slot</TableCell>
              <TableCell>{formatDateShort(document.reservation_deadline)}</TableCell>
              <TableCell><DocumentStatusBadge doc={document} /></TableCell>
              <TableCell>
                <Link to="/peminjam/pinjam/$documentId" params={{ documentId: String(document.id) }}>
                  <Button size="sm" variant="outline">{['DRAFT', 'REVISION'].includes(document.status) ? 'Lengkapi' : 'Lihat'}</Button>
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
