import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bookingPolicyService } from '@/services/booking-policy.service';
import { previewRowForDate } from '@/lib/policyRules';
import { useDebounce } from '@/hooks/useDebounce';
import type { PolicyDraft } from '@/types/booking-policy';

export function PolicySimulator({ draft }: { draft: PolicyDraft }) {
  const [hDate, setHDate] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');
  const debouncedDraft = useDebounce(draft, 500);
  const preview = useQuery({
    queryKey: ['policy-preview-simulator', hDate, debouncedDraft],
    queryFn: () => bookingPolicyService.preview({ ...debouncedDraft, date: hDate }),
    enabled: !!hDate,
  });
  const result = hDate ? previewRowForDate(preview.data?.preview ?? [], hDate, today) : null;
  const warnings = preview.data && !preview.data.valid ? Object.entries(preview.data.warnings) : [];

  return (
    <div className="space-y-2">
      <Label htmlFor="simulator-h">Tanggal peminjaman (H)</Label>
      <Input id="simulator-h" type="date" value={hDate} onChange={(event) => setHDate(event.target.value)} />
      {warnings.map(([key, values]) => (
        <p key={key} className="text-sm text-destructive">{key}: {values.join(', ')}</p>
      ))}
      {result?.row && (
        <p className="text-sm">
          H-{result.row.h_minus}: tier {result.row.matched_min_days ?? '-'} → deadline {result.row.deadline ?? '-'}
        </p>
      )}
      {result?.reason && <p className="text-sm text-destructive">{result.reason}</p>}
    </div>
  );
}
