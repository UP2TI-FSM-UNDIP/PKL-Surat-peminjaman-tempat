import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PolicyAudit } from '@/types/booking-policy';

export function PolicyAuditTable({ audits }: { audits: PolicyAudit[] }) {
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Aksi</TableHead><TableHead>Aktor</TableHead><TableHead>Waktu</TableHead><TableHead>Perubahan</TableHead></TableRow></TableHeader>
      <TableBody>
        {audits.map((audit) => (
          <TableRow key={audit.id}>
            <TableCell>{audit.action}</TableCell>
            <TableCell>{audit.user_id ? `User #${audit.user_id}` : 'Sistem'}</TableCell>
            <TableCell>{audit.created_at}</TableCell>
            <TableCell className="max-w-[320px] truncate text-xs">{JSON.stringify(audit.after_json)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
