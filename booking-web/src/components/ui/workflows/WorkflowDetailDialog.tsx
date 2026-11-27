import { Button } from '@/components/ui/button/button';
import { DetailGrid, FormDialog } from '@/components/common/FormDialog';
import type { Workflow } from '@/services/workflow.service';

interface WorkflowDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWorkflow: Workflow | null;
  getScopeTypeLabel: (scopeType: string) => string;
  getCategoryLabel: (category: string) => string;
}

export function WorkflowDetailDialog({
  open,
  onOpenChange,
  selectedWorkflow,
  getScopeTypeLabel,
  getCategoryLabel,
}: WorkflowDetailDialogProps) {
  const steps = [...(selectedWorkflow?.steps ?? [])].sort((a, b) => a.step_order - b.step_order);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Detail alur'
      description={selectedWorkflow?.name}
      size='md'
      footer={<Button onClick={() => onOpenChange(false)}>Tutup</Button>}
    >
      {selectedWorkflow && (
        <div className='space-y-4'>
          <DetailGrid
            items={[
              ['Kategori', getCategoryLabel(selectedWorkflow.applies_to_category)],
              ['Jumlah tahap', `${steps.length} tahap`],
              ['Deskripsi', selectedWorkflow.description, true],
            ]}
          />
          <div className='border-t border-black/[0.06] pt-4'>
            <h3 className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>Tahapan</h3>
            {steps.length > 0 ? (
              <ol className='space-y-1.5'>
                {steps.map((step) => (
                  <li key={step.id} className='flex items-start gap-3 rounded-xl bg-muted/60 px-3 py-2'>
                    <span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white'>
                      {step.step_order}
                    </span>
                    <div className='min-w-0'>
                      <p className='text-[13px] font-medium'>{step.step_name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {step.target_role_slug} · {getScopeTypeLabel(step.scope_type)}
                        {step.target_category_lookup ? ` · ${getCategoryLabel(step.target_category_lookup)}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className='text-[13px] text-muted-foreground'>Belum ada tahap.</p>
            )}
          </div>
        </div>
      )}
    </FormDialog>
  );
}

export default WorkflowDetailDialog;
