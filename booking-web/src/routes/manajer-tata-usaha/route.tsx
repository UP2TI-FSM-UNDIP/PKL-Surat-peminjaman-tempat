import { createFileRoute, redirect } from '@tanstack/react-router';
import { authService } from '@/services/auth.service';
import { isPathInRole } from '@/lib/roleRoutes';
import { ApprovalLayout } from '@/features/approvals/ApprovalLayout';

export const Route = createFileRoute('/manajer-tata-usaha')({
  beforeLoad: ({ location }) => {
    if (!authService.isAuthenticated()) throw redirect({ to: '/' });
    if (authService.getRoleSlug() !== 'manajer-tata-usaha') {
      throw redirect({ to: authService.getRolePath(authService.getRoleSlug()) });
    }
    if (!isPathInRole(location.pathname, '/manajer-tata-usaha')) {
      throw redirect({ to: '/manajer-tata-usaha' });
    }
  },
  component: () => <ApprovalLayout role="manajer-tata-usaha" />,
});
