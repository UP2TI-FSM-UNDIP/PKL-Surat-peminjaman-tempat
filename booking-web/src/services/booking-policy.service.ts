import api from '@/lib/axios';
import type {
  BookingPolicy,
  PolicyAudit,
  PolicyDraft,
  PolicyPreview,
  PolicyRecalculation,
} from '@/types/booking-policy';
import { normalizeWarnings } from '@/lib/policyRules';
import type { PaginatedData } from '@/types/pagination';

interface SingleResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const bookingPolicyService = {
  async get(): Promise<BookingPolicy> {
    const response = await api.get<SingleResponse<BookingPolicy>>('/admin/booking-policy');
    return response.data.data;
  },

  async update(payload: PolicyDraft): Promise<BookingPolicy> {
    const response = await api.put<SingleResponse<BookingPolicy>>('/admin/booking-policy', payload);
    return response.data.data;
  },

  async preview(payload: PolicyDraft & { date?: string }): Promise<PolicyPreview> {
    const response = await api.post<{
      success: boolean;
      data: { valid: boolean; warnings: unknown; preview: PolicyPreview['preview'] };
    }>('/admin/booking-policy/preview', payload);
    const body = response.data.data;
    return {
      valid: body.valid,
      warnings: normalizeWarnings(body.warnings),
      preview: body.preview,
    };
  },

  async audits(page = 1): Promise<PaginatedData<PolicyAudit>> {
    const response = await api.get<SingleResponse<PaginatedData<PolicyAudit>>>('/admin/booking-policy/audits', {
      params: { page },
    });
    return response.data.data;
  },

  async recalculate(dryRun: boolean, policyId?: number): Promise<PolicyRecalculation> {
    const response = await api.post<SingleResponse<PolicyRecalculation>>('/admin/booking-policy/recalculate', {
      dry_run: dryRun,
      policy_id: policyId ?? null,
    });
    return response.data.data;
  },
};
