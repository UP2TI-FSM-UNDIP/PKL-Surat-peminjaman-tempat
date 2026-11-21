import { createFileRoute, redirect } from '@tanstack/react-router';
import { authService } from '@/services/auth.service';
import { isPathInRole } from '@/lib/roleRoutes';
import { ApprovalLayout } from '@/features/approvals/ApprovalLayout';

export const Route = createFileRoute('/wadek2')({
  beforeLoad: ({ location }) => {
    if (!authService.isAuthenticated()) throw redirect({ to: '/' });
    if (authService.getRoleSlug() !== 'wadek2') {
      throw redirect({ to: authService.getRolePath(authService.getRoleSlug()) });
    }
    if (!isPathInRole(location.pathname, '/wadek2')) {
      throw redirect({ to: '/wadek2' });
    }
  },
  component: () => <ApprovalLayout role="wadek2" />,
});
