import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PolicyPreviewRow } from '@/types/booking-policy';

export function PolicyPreviewTable({ rows }: { rows: PolicyPreviewRow[] }) {
  return (
    <Table>
      <TableHeader><TableRow><TableHead>H-</TableHead><TableHead>Tanggal pengajuan</TableHead><TableHead>Tier</TableHead><TableHead>Offset</TableHead><TableHead>Deadline</TableHead></TableRow></TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.h_minus}>
            <TableCell>H-{row.h_minus}</TableCell>
            <TableCell>{row.application_date}</TableCell>
            <TableCell>{row.matched_min_days ?? '-'}</TableCell>
            <TableCell>{row.deadline_offset ?? '-'}</TableCell>
            <TableCell>{row.deadline ?? '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
