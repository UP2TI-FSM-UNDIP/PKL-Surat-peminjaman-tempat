import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Check, RotateCcw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { approvalService } from '@/services/approval.service';
import { getErrorMessage } from '@/lib/errors';

type Action = 'approve' | 'reject' | 'revise';

export function ApprovalActions({ documentId, onDone }: { documentId: string; onDone: () => void }) {
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: { action: Action; note: string }) => {
      if (input.action === 'approve') return approvalService.approve(documentId, input.note);
      if (input.action === 'reject') return approvalService.reject(documentId, input.note);
      return approvalService.revise(documentId, input.note);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      await queryClient.invalidateQueries({ queryKey: ['reservation-summary', documentId] });
      await queryClient.invalidateQueries({ queryKey: ['room-bookings'] });
      toast.success('Keputusan tersimpan.');
      setAction(null);
      setNote('');
      onDone();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Gagal menyimpan keputusan.')),
  });

  const invalid = action === 'reject' ? note.trim().length < 10 : action === 'revise' ? note.trim().length === 0 : false;

  return (
    <>
      <div className="grid gap-2">
        <Button size="lg" className="w-full" onClick={() => setAction('approve')}>
          <Check className="size-4" /> Setujui
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setAction('revise')}>
            <RotateCcw className="size-4" /> Revisi
          </Button>
          <Button variant="secondary" className="text-destructive hover:bg-[#fdeeee]" onClick={() => setAction('reject')}>
            <X className="size-4" /> Tolak
          </Button>
        </div>
      </div>
      <Dialog open={action !== null} onOpenChange={(open) => { if (!open) setAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'approve' ? 'Setujui pengajuan' : action === 'revise' ? 'Kembalikan untuk revisi' : 'Tolak pengajuan'}</DialogTitle>
            <DialogDescription>
              {action === 'approve' ? 'Catatan opsional.' : action === 'revise' ? 'Catatan wajib.' : 'Catatan minimal 10 karakter.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea aria-label="Catatan" placeholder="Tulis catatan…" className="rounded-xl" value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAction(null)}>Batal</Button>
            <Button
              variant={action === 'reject' ? 'destructive' : 'default'}
              disabled={invalid || mutation.isPending}
              onClick={() => action && mutation.mutate({ action, note })}
            >
              {action === 'approve' ? 'Ya, setujui' : action === 'revise' ? 'Kirim revisi' : 'Ya, tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
