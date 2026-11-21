import { createFileRoute } from '@tanstack/react-router';
import { ApprovalHistoryPage } from '@/features/approvals/ApprovalHistoryPage';

export const Route = createFileRoute('/wadek2/riwayat')({
  component: () => <ApprovalHistoryPage detailRoute="/wadek2/$documentId" />,
});
