import { createFileRoute, redirect } from '@tanstack/react-router';
import { authService } from '@/services/auth.service';
import { isPathInRole } from '@/lib/roleRoutes';
import { ApprovalLayout } from '@/features/approvals/ApprovalLayout';

export const Route = createFileRoute('/spv-sumberdaya')({
  beforeLoad: ({ location }) => {
    if (!authService.isAuthenticated()) throw redirect({ to: '/' });
    if (authService.getRoleSlug() !== 'spv-sumberdaya') {
      throw redirect({ to: authService.getRolePath(authService.getRoleSlug()) });
    }
    if (!isPathInRole(location.pathname, '/spv-sumberdaya')) {
      throw redirect({ to: '/spv-sumberdaya' });
    }
  },
  component: () => <ApprovalLayout role="spv-sumberdaya" />,
});
