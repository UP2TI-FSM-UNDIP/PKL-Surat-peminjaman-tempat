import { formatDateShort } from '@/lib/date';
import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { documentService } from '@/services/document.service';
import { DocumentStatusBadge } from '@/components/DocumentStatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyRow, TableCard } from '@/components/common/TableCard';
import { RoomCodes } from '@/components/common/RoomCodes';

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
      <PageHeader
        title="Daftar pengajuan"
        count={pagination?.total ?? documents.length}
        actions={<Link to="/peminjam/pinjam/baru" search={{ jenis: 'reservasi' }}><Button>Buat reservasi</Button></Link>}
      />
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
      <TableCard>
      <Table>
        <TableHeader><TableRow><TableHead>Kegiatan</TableHead><TableHead>Ruang</TableHead><TableHead>Tanggal</TableHead><TableHead>Batas proposal</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{document.content?.event_name ?? document.title}</TableCell>
              <TableCell><RoomCodes slots={document.content?.slots} /></TableCell>
              <TableCell>{formatDateShort(document.content?.slots?.[0]?.booking_date)}{(document.content?.slots?.length ?? 0) > 1 && <span className="text-muted-foreground"> · {document.content?.slots?.length} slot</span>}</TableCell>
              <TableCell>{formatDateShort(document.reservation_deadline)}</TableCell>
              <TableCell><DocumentStatusBadge doc={document} /></TableCell>
              <TableCell>
                <Link to="/peminjam/pinjam/$documentId" params={{ documentId: String(document.id) }}>
                  <Button size="sm" variant="outline">{['DRAFT', 'REVISION'].includes(document.status) ? 'Lengkapi' : 'Lihat'}</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {documents.length === 0 && !query.isLoading && <EmptyRow colSpan={6}>Belum ada pengajuan.</EmptyRow>}
        </TableBody>
      </Table>
      </TableCard>
      {pagination && pagination.last_page > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button>
          <Button variant="outline" disabled={page >= pagination.last_page} onClick={() => setPage((value) => value + 1)}>Berikutnya</Button>
        </div>
      )}
    </div>
  );
}
