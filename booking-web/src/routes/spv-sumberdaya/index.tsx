import { createFileRoute } from '@tanstack/react-router';
import { ApprovalQueuePage } from '@/features/approvals/ApprovalQueuePage';

export const Route = createFileRoute('/spv-sumberdaya/')({
  component: () => <ApprovalQueuePage detailRoute="/spv-sumberdaya/$documentId" />,
});
