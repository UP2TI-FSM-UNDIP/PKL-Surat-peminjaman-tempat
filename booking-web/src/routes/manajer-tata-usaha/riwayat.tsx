import { createFileRoute } from '@tanstack/react-router';
import { ApprovalHistoryPage } from '@/features/approvals/ApprovalHistoryPage';

export const Route = createFileRoute('/manajer-tata-usaha/riwayat')({
  component: () => <ApprovalHistoryPage detailRoute="/manajer-tata-usaha/$documentId" />,
});
