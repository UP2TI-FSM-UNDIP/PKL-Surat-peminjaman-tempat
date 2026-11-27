import { Field, FormDialog, FormSection } from '@/components/common/FormDialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Role } from '@/services/role.service';

export type StepFormData = {
  step_order: number;
  step_name: string;
  target_role_slug: string;
  scope_type: 'SELF' | 'PARENT' | 'FACULTY_LEADER' | 'SPECIFIC_CATEGORY';
  target_category_lookup: string;
};

interface CategoryOption {
  value: string;
  label: string;
}

interface ScopeTypeOption {
  value: string;
  label: string;
  description?: string;
}

interface WorkflowStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  stepFormData: StepFormData;
  setStepFormData: (
    updater: StepFormData | ((prev: StepFormData) => StepFormData),
  ) => void;
  roles: Role[];
  categories: readonly CategoryOption[];
  scopeTypes: readonly ScopeTypeOption[];
  onSubmit: () => void;
  submitLabel: string;
}

export function WorkflowStepDialog({
  open,
  onOpenChange,
  title,
  description,
  stepFormData,
  setStepFormData,
  roles,
  categories,
  scopeTypes,
  onSubmit,
  submitLabel,
}: WorkflowStepDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size='md'
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      submitLabel={submitLabel}
    >
      <FormSection>
        <Field label='Nama tahap' htmlFor='step_name' required>
          <Input
            id='step_name'
            value={stepFormData.step_name}
            onChange={(e) => setStepFormData({ ...stepFormData, step_name: e.target.value })}
            placeholder='Contoh: Approval Ketua'
            required
          />
        </Field>
        <Field label='Urutan' htmlFor='step_order'>
          <Input
            id='step_order'
            type='number'
            min={1}
            value={stepFormData.step_order}
            onChange={(e) => setStepFormData({ ...stepFormData, step_order: Number.parseInt(e.target.value, 10) || 0 })}
          />
        </Field>
        <Field label='Role penyetuju' htmlFor='target_role'>
          <Select value={stepFormData.target_role_slug} onValueChange={(value) => setStepFormData({ ...stepFormData, target_role_slug: value })}>
            <SelectTrigger id='target_role' className='w-full'>
              <SelectValue placeholder='Pilih role…' />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.slug}>{role.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label='Cakupan' htmlFor='scope_type' hint={scopeTypes.find((type) => type.value === stepFormData.scope_type)?.description}>
          <Select
            value={stepFormData.scope_type}
            onValueChange={(value) => setStepFormData({ ...stepFormData, scope_type: value as StepFormData['scope_type'] })}
          >
            <SelectTrigger id='scope_type' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopeTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {stepFormData.scope_type === 'SPECIFIC_CATEGORY' && (
          <Field label='Kategori target' htmlFor='target_category' wide>
            <Select
              value={stepFormData.target_category_lookup}
              onValueChange={(value) => setStepFormData({ ...stepFormData, target_category_lookup: value })}
            >
              <SelectTrigger id='target_category' className='w-full'>
                <SelectValue placeholder='Pilih kategori…' />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </FormSection>
    </FormDialog>
  );
}

export default WorkflowStepDialog;
