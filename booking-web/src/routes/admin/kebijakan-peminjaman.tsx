import { createFileRoute } from '@tanstack/react-router';
import { BookingPolicyForm } from '@/features/admin-policy/BookingPolicyForm';

export const Route = createFileRoute('/admin/kebijakan-peminjaman')({ component: BookingPolicyForm });
