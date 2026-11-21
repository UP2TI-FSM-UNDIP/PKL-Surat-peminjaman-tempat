import { createFileRoute } from '@tanstack/react-router';
import { ApprovalQueuePage } from '@/features/approvals/ApprovalQueuePage';

export const Route = createFileRoute('/manajer-tata-usaha/')({
  component: () => <ApprovalQueuePage detailRoute="/manajer-tata-usaha/$documentId" />,
});
