import { createFileRoute } from '@tanstack/react-router';
import { ApprovalDetailPage } from '@/features/approvals/ApprovalDetailPage';

export const Route = createFileRoute('/spv-sumberdaya/$documentId')({
  component: function SpvDetail() {
    const { documentId } = Route.useParams();
    return <ApprovalDetailPage documentId={Number(documentId)} basePath="/spv-sumberdaya" />;
  },
});
