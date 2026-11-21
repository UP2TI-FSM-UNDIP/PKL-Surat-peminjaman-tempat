import { createFileRoute } from '@tanstack/react-router';
import { ApprovalDetailPage } from '@/features/approvals/ApprovalDetailPage';

export const Route = createFileRoute('/manajer-tata-usaha/$documentId')({
  component: function ManajerTuDetail() {
    const { documentId } = Route.useParams();
    return <ApprovalDetailPage documentId={Number(documentId)} basePath="/manajer-tata-usaha" />;
  },
});
