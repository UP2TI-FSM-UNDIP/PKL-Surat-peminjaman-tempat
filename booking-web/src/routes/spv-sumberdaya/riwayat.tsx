import { createFileRoute } from '@tanstack/react-router';
import { ApprovalHistoryPage } from '@/features/approvals/ApprovalHistoryPage';

export const Route = createFileRoute('/spv-sumberdaya/riwayat')({
  component: () => <ApprovalHistoryPage detailRoute="/spv-sumberdaya/$documentId" />,
});
