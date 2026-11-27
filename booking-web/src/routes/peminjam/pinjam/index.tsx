import { documentKey } from '@/types/document';
import { formatDateShort, formatTimeRange } from '@/lib/date';
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

export const Route = createFileRoute('/peminjam/pinjam/')({
  validateSearch: (search: Record<string, unknown>): { status: string } => {
    const value = typeof search.status === 'string' ? search.status : '';
    return { status: value === 'ALL' ? '' : value };
  },
  component: SubmissionListPage,
});

/** Filter status disederhanakan: beberapa status digabung dalam satu kelompok. */
const filters = [
  { value: 'ALL', label: 'Semua' },
  { value: 'DRAFT,REVISION', label: 'Perlu dilengkapi' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED,EXPIRED,CANCELLED', label: 'Tidak aktif' },
] as const;

function SlotList({ slots }: { slots?: Array<{ room_id: number; room_code?: string | null; booking_date: string; start_time: string; end_time: string }> }) {
  if (!slots?.length) return <span className="text-muted-foreground">—</span>;
  const sorted = [...slots].sort((x, y) => `${x.booking_date}${x.start_time}`.localeCompare(`${y.booking_date}${y.start_time}`));
  return (
    <ul className="space-y-1">
      {sorted.map((slot, index) => (
        <li key={`${slot.room_id}-${slot.booking_date}-${index}`} className="flex items-center gap-2 whitespace-nowrap text-[13px]">
          <span className="w-[88px] shrink-0">{formatDateShort(slot.booking_date)}</span>
          <span className="w-[84px] shrink-0 text-muted-foreground tabular-nums">{formatTimeRange(slot.start_time, slot.end_time)}</span>
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium">{slot.room_code ?? 'Ruang'}</span>
        </li>
      ))}
    </ul>
  );
}

function SubmissionListPage() {
  const { status: initialStatus } = Route.useSearch();
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['documents', 'my', status, page],
    queryFn: () => documentService.getDocuments({ status: status || undefined, page_my: page, mine: 1 }),
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
        options={filters}
      />
      <div className="space-y-2 md:hidden">
        {documents.map((document) => (
          <Link
            key={document.id}
            to="/peminjam/pinjam/$documentId"
            params={{ documentId: documentKey(document) }}
            className="block rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] active:bg-muted/50"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="min-w-0 text-[14px] font-semibold leading-snug">{document.content?.event_name || document.content?.purpose || document.title}</p>
              <DocumentStatusBadge doc={document} />
            </div>
            <SlotList slots={document.content?.slots} />
            {['DRAFT', 'REVISION'].includes(document.status) && (
              <p className="mt-2 text-xs text-destructive">Lengkapi proposal sebelum {formatDateShort(document.reservation_deadline)}</p>
            )}
          </Link>
        ))}
        {documents.length === 0 && !query.isLoading && (
          <p className="rounded-2xl bg-white p-6 text-center text-[13px] text-muted-foreground">Belum ada pengajuan.</p>
        )}
      </div>
      <TableCard className="hidden md:block">
      <Table>
        <TableHeader><TableRow><TableHead>Kegiatan</TableHead><TableHead>Jadwal (tanggal · jam · ruang)</TableHead><TableHead>Batas proposal</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="align-top font-medium whitespace-normal">{document.content?.event_name || document.content?.purpose || document.title}</TableCell>
              <TableCell className="align-top"><SlotList slots={document.content?.slots} /></TableCell>
              <TableCell className="align-top">{['DRAFT', 'REVISION'].includes(document.status) ? formatDateShort(document.reservation_deadline) : <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell className="align-top"><DocumentStatusBadge doc={document} /></TableCell>
              <TableCell className="align-top text-right">
                <Link to="/peminjam/pinjam/$documentId" params={{ documentId: documentKey(document) }}>
                  <Button size="sm" variant="outline">{['DRAFT', 'REVISION'].includes(document.status) ? 'Lengkapi' : 'Lihat'}</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {documents.length === 0 && !query.isLoading && <EmptyRow colSpan={5}>Belum ada pengajuan.</EmptyRow>}
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
