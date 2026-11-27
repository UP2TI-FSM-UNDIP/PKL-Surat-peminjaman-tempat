import { createFileRoute } from '@tanstack/react-router';
import { ApprovalDetailPage } from '@/features/approvals/ApprovalDetailPage';

export const Route = createFileRoute('/wadek2/$documentId')({
  component: function Wadek2Detail() {
    const { documentId } = Route.useParams();
    return <ApprovalDetailPage documentId={documentId} basePath="/wadek2" />;
  },
});
