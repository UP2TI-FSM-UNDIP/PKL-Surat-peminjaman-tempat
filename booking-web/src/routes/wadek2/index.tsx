import { createFileRoute } from '@tanstack/react-router';
import { ApprovalQueuePage } from '@/features/approvals/ApprovalQueuePage';

export const Route = createFileRoute('/wadek2/')({
  component: () => <ApprovalQueuePage detailRoute="/wadek2/$documentId" />,
});
